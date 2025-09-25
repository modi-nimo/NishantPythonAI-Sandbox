#
# Copyright (c) 2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#
import asyncio
import os
import time
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import Any, Dict

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Request, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import aiohttp

# Load environment variables
load_dotenv(override=True)

from pipecat_research_main import run_bot


# from bot_websocket_server import run_bot_websocket_server


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles FastAPI startup and shutdown."""
    yield  # Run app


# Initialize FastAPI app with lifespan manager
app = FastAPI(lifespan=lifespan)

# Configure CORS to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, room_url: str | None = None, is_dynamic_room: bool = False,
                             meeting_token: str | None = None):
    await websocket.accept()
    print("WebSocket connection accepted")
    try:
        await run_bot(websocket, room_url, is_dynamic_room, meeting_token)
    except Exception as e:
        print(f"Exception in run_bot: {e}")


@app.post("/connect")
async def bot_connect(request: Request) -> Dict[Any, Any]:
    query_params = request.query_params
    room_url = query_params.get("room_url")
    is_dynamic_room = query_params.get("is_dynamic_room", "false").lower() == "true"

    meeting_token = None

    if is_dynamic_room:
        response = await create_daily_room()
        room_url = response.get("url")
        print(f"Created a dynamic room: {room_url}")
        # The bot needs a token to join, even its own room
        token_response = await get_meeting_token(room_name=room_url.split('/')[-1])
        meeting_token = token_response.get("token")
    else:
        # Get a meeting token for the bot to join the existing room
        room_name = room_url.split('/')[-1]
        token_response = await get_meeting_token(room_name=room_name)
        meeting_token = token_response.get("token")

    ws_url = "ws://localhost:7860/ws"
    if room_url:
        ws_url += f"?room_url={room_url}"
    if is_dynamic_room:
        ws_url += f"&is_dynamic_room={is_dynamic_room}"
    if meeting_token:
        ws_url += f"&meeting_token={meeting_token}"

    print(f"Connecting to WebSocket: {ws_url}")
    return {"ws_url": ws_url, "room_url": room_url}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/get_meeting_token")
async def get_meeting_token(room_name: str, user_name: str = "Helper Bot"):
    daily_api_key = os.getenv("DAILY_API_KEY")
    if not daily_api_key:
        raise HTTPException(status_code=500, detail="DAILY_API_KEY not set in environment variables")

    # Calculate expiration time (current time + 20 minutes)
    expiration_time = datetime.now() + timedelta(minutes=20)
    exp_timestamp = int(expiration_time.timestamp())

    payload = {
        "properties": {
            "room_name": room_name,
            "user_name": user_name,
            "eject_at_token_exp": False,
            "exp": exp_timestamp,
            "is_owner": True
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {daily_api_key}"
    }

    async with aiohttp.ClientSession() as session:
        async with session.post("https://api.daily.co/v1/meeting-tokens", json=payload, headers=headers) as response:
            if response.status != 200:
                response_text = await response.text()
                raise HTTPException(status_code=response.status, detail=f"Daily API error: {response_text}")
            return await response.json()


@app.post("/create_daily_room")
async def create_daily_room():
    daily_api_key = os.getenv("DAILY_API_KEY")
    if not daily_api_key:
        raise HTTPException(status_code=500, detail="DAILY_API_KEY not set in environment variables")

    # Room will expire in 30 minutes
    expiration_time = datetime.now() + timedelta(minutes=30)
    exp_timestamp = int(expiration_time.timestamp())

    payload = {
        "properties": {
            "exp": exp_timestamp,
            "enable_prejoin_ui": True,
            "enable_knocking": False,
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {daily_api_key}"
    }

    async with aiohttp.ClientSession() as session:
        async with session.post("https://api.daily.co/v1/rooms", json=payload, headers=headers) as response:
            if response.status != 200:
                response_text = await response.text()
                raise HTTPException(status_code=response.status, detail=f"Daily API error: {response_text}")
            return await response.json()


@app.delete("/delete_daily_room/{room_name}")
async def delete_daily_room(room_name: str):
    daily_api_key = os.getenv("DAILY_API_KEY")
    if not daily_api_key:
        raise HTTPException(status_code=500, detail="DAILY_API_KEY not set in environment variables")

    headers = {
        "Authorization": f"Bearer {daily_api_key}"
    }

    async with aiohttp.ClientSession() as session:
        async with session.delete(f"https://api.daily.co/v1/rooms/{room_name}", headers=headers) as response:
            if response.status != 200:
                response_text = await response.text()
                raise HTTPException(status_code=response.status, detail=f"Daily API error: {response_text}")
            return {"status": "ok", "message": f"Room '{room_name}' deleted."}


async def main():
    server_mode = os.getenv("WEBSOCKET_SERVER", "fast_api")
    tasks = []
    try:
        # if server_mode == "websocket_server":
        #     tasks.append(run_bot_websocket_server())

        config = uvicorn.Config(app, host="0.0.0.0", port=7860)
        server = uvicorn.Server(config)
        tasks.append(server.serve())

        await asyncio.gather(*tasks)
    except asyncio.CancelledError:
        print("Tasks cancelled (probably due to shutdown).")


if __name__ == "__main__":
    asyncio.run(main())