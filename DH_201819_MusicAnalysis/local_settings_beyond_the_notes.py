# This file does not contain a real username or password. Please substitute your respective local username and password.
#from DH_201819_MusicAnalysis.settings import PROJECT_ROOT, SITE_ROOT
import os

DEBUG = True
TEMPLATE_DEBUG = True

DATABASES = {
    'default': {
         "ENGINE": "django.db.backends.postgresql_psycopg2",
         "NAME": "name",
         "USER": "user",
         "PASSWORD": "",
         "HOST": "localhost",
         "PORT": "5432"
    }
}
