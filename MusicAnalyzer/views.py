from django.shortcuts import render
from django.views import View


class Choice(View):
    def get(self, request):
        context_dict = {"heading": "Choose here"}
        # information from the context dictionary can be referenced in the template
        return render(request, "MusicAnalyzer/Choice.html", context_dict)

    # handle data getting back from view
    def post(self, request):
        pass
