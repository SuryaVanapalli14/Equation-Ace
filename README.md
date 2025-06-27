#Prerequisites

A .env file is required to run the application.
Follow these steps to get the required keys in the .env file :
1. Go to https://firebase.google.com
2. Sign in with your google account
3. If you have an existing project, select it.
   if you don't have a project, Create one by clicking "Add project"
4. Inside your Firebase project - left hand navigation menu -> gear icon (⚙️ Settings)
5. click "Project settings" & scroll down to "Your apps" section
6. Click on the "Web" icon ( </> )
7. Enter App nickname & Do not check the checkbox unless you want to host the application.(keep it un-ticked)
8. Click "Register app" => "Add Firebase SDK"
9. copy the entire firebaseConfig object and paste it in a newly created .env file in the project folder

COMMANDS:
In project terminal
During the first time to install required node modules
 > npm install
To run the application
 > npm run dev

To stop a running server use Ctrl + c in the project terminal

