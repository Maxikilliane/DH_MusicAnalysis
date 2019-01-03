from django.urls import path, include, re_path
from MusicAnalyzer.views import *
from DH_201819_MusicAnalysis import settings

app_name = 'MusicAnalyzer'

# name nur bei Verwendung von Links aus anderen Seiten relevant
urlpatterns = [
    #re_path(r'^viewData/$', ViewData.as_view(), name="viewData"),  # example for connection views
]


if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += staticfiles_urlpatterns()