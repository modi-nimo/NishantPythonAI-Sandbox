import time

import pyautogui

screenWidth, screenHeight = pyautogui.size()


# print(screenWidth, screenHeight) 1512 982

def get_location():
    currentMouseX, currentMouseY = pyautogui.position()
    print(currentMouseX, currentMouseY)


list_of_numbers = [

]
# get_location()
def verify_numbers():
    for single_number in list_of_numbers:
        pyautogui.moveTo(2588, 352)
        pyautogui.click()

        pyautogui.hotkey("command", "t")
        pyautogui.write(f"https://api.whatsapp.com/send/?phone=91{single_number}&text&type=phone_number&app_absent=0")
        pyautogui.press("enter")

        time.sleep(5)

def send_whatsapp_message():
    for single_number in list_of_numbers:
        pyautogui.moveTo(2588, 352)
        pyautogui.click()

        pyautogui.hotkey("command", "t")
        pyautogui.write(f"https://api.whatsapp.com/send/?phone=91{single_number}&text&type=phone_number&app_absent=0")
        pyautogui.press("enter")

        print("Waiting for the page to load...")
        time.sleep(5)
        pyautogui.moveTo(627, 961)
        pyautogui.click()

        pyautogui.hotkey("command", "v")
        time.sleep(3)
        pyautogui.press("enter")
        print(f"Message sent successfully to {single_number}!")
        time.sleep(2)



from mac_notifications import client


if __name__ == "__main__":
    print("Starting the automation in 5 seconds...")
    time.sleep(5)
    # verify_numbers()
    send_whatsapp_message()
    client.create_notification(
        title="Genie",
        subtitle="Your WhatsApp messages have been sent successfully!",
    )
