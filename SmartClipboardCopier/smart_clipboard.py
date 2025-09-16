# import apprise
# from apprise import NotifyType
#
# apobj = apprise.Apprise()
# apobj.add("macosx://")
# apobj.notify(
#     body="Testing",
#     title="Hello World",
#     notify_type=NotifyType.WARNING
# )
import sys
# ========== Clipboard Logger ==========

import time
import pyperclip
from loguru import logger

history = []
file_name = f"copied_data_{time.strftime('%Y%m%d')}.log"
logger.add(sink=file_name, format="{time} {level} {message}", colorize=True)
def clipboard_logger():
    recent_value = ""
    while True:
        tmp_value = pyperclip.paste()
        if tmp_value != recent_value:
            recent_value = tmp_value
            history.append(recent_value)
            logger.info(f"Copied: {recent_value}")
        time.sleep(1)

clipboard_logger()


