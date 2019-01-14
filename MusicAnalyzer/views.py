from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from MusicAnalyzer.forms import FileForm


class Choice(View):
    form_class= FileForm
    template_name = "MusicAnalyzer/Choice.html"
    music_xml_files = []
    context_dict = {"heading": "Choose here", "files": music_xml_files}

    def get(self, request):
        file_form = self.form_class()
        self.context_dict["file_form"] = file_form
        # information from the context dictionary can be referenced in the template
        return render(request, "MusicAnalyzer/Choice.html", self.context_dict)

    # handle data getting back from view
    def post(self, request):
        file_form = self.form_class(request.POST, request.FILES)
        files = request.FILES.getlist('files')
        if file_form.is_valid():
            for f in files:
                print(f.name)
                self.music_xml_files.append(f.name)
                data = {'is_valid': True, 'name': f.name,}
            #return render(request, "MusicAnalyzer/Choice.html", self.context_dict)
        else:
            self.context_dict.update({"message": "form not valid", "file_form": file_form})
            #return render(request, "MusicAnalyzer/Choice.html", self.context_dict)
            data = {'is_valid':False}
        return JsonResponse(data)