# DH_MusicAnalysis

A Django Project which requires Python 3.6.5 and Django 2.1.4 (https://www.djangoproject.com/download/) and uses the Music21 Library (see http://web.mit.edu/music21/doc/about/what.html) to provide a graphical user interface for musicologists.

Explore it here: https://beyondthenotes.herokuapp.com/

## Instructions to install BeyondTheNotes locally

1.	Download the code from the Github repository at https://github.com/Maxikilliane/DH_MusicAnalysis .
 
2.	Install PyCharm, in case it is not already installed (instructions here: 
https://www.jetbrains.com/pycharm/download/#section=windows).
3.	Open the project with PyCharm.
4.	Select a Project Interpreter (Python 3.6). Check the settings (Windows) or preferences (MacOs) – also see here: https://www.jetbrains.com/help/pycharm/settings-preferences-dialog.html - to see which packages are installed. You should have the same packages as in the following screenshot. Install packages with the respective version where appropriate. 
 
5.	If you have not already installed PostgreSQL, install it now. Download is possible from here: https://www.postgresql.org/download/ .
6.	Use PgAdmin (Interface of PostgreSQL) to create a new empty database.
7.	Change the database information in the local_settings_beyond_the_notes.py file, which is located at DH_MusicAnalysis\local_settings_beyond_the_notes.py. Replace the value of the the name parameter with the name of your database, the value of the user parameter with your user name and the value of the password parameter with your password. Then change the name of your file to "local_settings.py".
 

8.	To activate the virtual environment, navigate to the terminal tab in PyCharm and enter the command "venv\Scripts\activate" there. 

Do not be irritated by possible error messages, as long as your path is preceded by "venv" now. 

(venv) C:\Path\to\the\project\DH_201819_MusicAnalysis>

9.	If your local database server is not running already, start it now. (Instructions here: https://www.postgresql.org/docs/9.1/server-start.html ).


10.	Start the application now. In case you are using PyCharm Professional Edition, then you can click on the green triangle.
 
In case you are using PyCharm Community Edition, then open the terminal tab in PyCharm and enter the command "python manage.py runserver" there. 

After your application is started, the run tab in PyCharm should display something like this:
 
To reach the local version of BeyondTheNotes, click on the link in the run tab.

11.	If "unapplied migrations" are mentioned in the run tab, then please follow the instructions which should also be there. It will probably be necessary to run  "python manage.py migrate" in the terminal tab. You can find more information here: https://docs.djangoproject.com/en/2.1/topics/migrations/ .

