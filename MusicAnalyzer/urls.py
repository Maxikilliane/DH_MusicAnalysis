from django.urls import re_path
from MusicAnalyzer.views import *
from DH_201819_MusicAnalysis import settings

app_name = 'MusicAnalyzer'

# name nur bei Verwendung von Links aus anderen Seiten relevant
urlpatterns = [
    re_path(r'^choice/$', Choice.as_view(), name="choice"),
]


if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += staticfiles_urlpatterns()
