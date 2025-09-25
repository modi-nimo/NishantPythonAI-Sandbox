#
# Copyright (c) 2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#
import os
import sys

import aiohttp
from dotenv import load_dotenv
from loguru import logger
from pipecat.audio.turn.smart_turn.base_smart_turn import SmartTurnParams
from pipecat.audio.turn.smart_turn.local_smart_turn_v3 import LocalSmartTurnAnalyzerV3
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.frameworks.rtvi import RTVIConfig, RTVIObserver, RTVIProcessor
from pipecat.runner.daily import configure
from pipecat.services.gemini_multimodal_live import GeminiMultimodalLiveLLMService
from pipecat.transports.daily.transport import DailyLogLevel
from pipecat.transports.daily.transport import DailyTransport, DailyParams

load_dotenv(override=True)

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")


SYSTEM_INSTRUCTION = f"""
"You are Gemini Chatbot, a friendly, helpful robot.

Your goal is to demonstrate your capabilities in a succinct way.

Your output will be converted to audio so don't include special characters in your answers.

Respond to what the user said in a creative and helpful way. Keep your responses brief. One or two sentences at most.
"""


async def run_bot(websocket_client, room_url: str | None = None, is_dynamic_room: bool = False, meeting_token: str | None = None):
    async with aiohttp.ClientSession() as session:
        configured_token = meeting_token
        if is_dynamic_room:
            # We already have the room_url from the server, but for the bot to join its own room, it needs a token
            # This is now handled in the server.py file, so we just set the token here.
            configured_token = meeting_token

        # Daily.co transport
        daily_transport = DailyTransport(
                room_url,
                configured_token, # Use configured_token for dynamic rooms and for joining pre-existing rooms
                "Helper bot",
                DailyParams(
                    audio_in_enabled=True,
                    audio_out_enabled=True,
                    transcription_enabled=True,
                    vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.2)),
                    turn_analyzer=LocalSmartTurnAnalyzerV3(params=SmartTurnParams()),
                ),
            )

        daily_transport.set_log_level(DailyLogLevel.Info)


        llm = GeminiMultimodalLiveLLMService(
            api_key=os.getenv("GOOGLE_API_KEY"),
            voice_id="Puck",  # Aoede, Charon, Fenrir, Kore, Puck
            transcribe_model_audio=True,
            system_instruction=SYSTEM_INSTRUCTION,
        )

        context = OpenAILLMContext(
            [
                {
                    "role": "user",
                    "content": "Start by greeting the user warmly and introducing yourself.",
                }
            ],
        )
        context_aggregator = llm.create_context_aggregator(context)

        # RTVI events for Pipecat client UI
        rtvi = RTVIProcessor(config=RTVIConfig(config=[]))

        pipeline = Pipeline(
            [
                daily_transport.input(),     # Audio to Daily.co room
                context_aggregator.user(),
                rtvi,
                llm,  # LLM
                daily_transport.output(),    # Audio from Daily.co room
                context_aggregator.assistant(),
            ]
        )

        task = PipelineTask(
            pipeline,
            params=PipelineParams(
                enable_metrics=True,
                enable_usage_metrics=True,
            ),
            observers=[RTVIObserver(rtvi)],
        )

        @rtvi.event_handler("on_client_ready")
        async def on_client_ready(rtvi):
            logger.info("Pipecat client ready.")
            await rtvi.set_bot_ready()
            # Kick off the conversation.
            await task.queue_frames([LLMRunFrame()])

        @daily_transport.event_handler("on_client_connected")
        async def on_daily_connected(transport, client):
            logger.info("Daily.co Client connected")

        @daily_transport.event_handler("on_client_disconnected")
        async def on_daily_disconnected(transport, client):
            logger.info("Daily.co Client disconnected")
            await task.cancel()
            if is_dynamic_room:
                room_name = transport.room_url.split("/")[-1]
                print(f"Room '{room_name}' was dynamically created. Attempting to delete.")
                async with aiohttp.ClientSession() as session:
                    try:
                        async with session.delete(f"http://localhost:7860/delete_daily_room/{room_name}") as resp:
                            if resp.status == 200:
                                print(f"Room '{room_name}' successfully deleted.")
                            else:
                                print(f"Failed to delete room '{room_name}': {await resp.text()}")
                    except Exception as e:
                        print(f"Error while deleting room '{room_name}': {e}")


        runner = PipelineRunner(handle_sigint=False)

        await runner.run(task)