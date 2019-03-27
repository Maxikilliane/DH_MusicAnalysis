from django.urls import re_path
from MusicAnalyzer.views import *
from DH_201819_MusicAnalysis import settings

app_name = 'MusicAnalyzer'

# name nur bei Verwendung von Links aus anderen Seiten relevant
try:
    print("try")
    urlpatterns = [
        re_path(r'^individualChoice/$', IndividualChoice.as_view(), name="individual_choice"),
        re_path(r'^distantChoice/$', DistantHearingChoice.as_view(), name="distant_choice"),
        re_path(r'^index/$', Index.as_view(), name="index"),
        re_path(r'^distantAnalysis/$', DistantAnalysis.as_view(), name="distant_analysis"),
        re_path(r'^individualAnalysis/$', IndividualAnalysis.as_view(), name="individual_analysis")
    ]

except:
    print("except")
    urlpatterns = []

if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    urlpatterns += staticfiles_urlpatterns()
