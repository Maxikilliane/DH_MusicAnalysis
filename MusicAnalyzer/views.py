import os

from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from music21 import metadata

from DH_201819_MusicAnalysis.settings import MEDIA_ROOT, BASE_DIR
from MusicAnalyzer.forms import FileForm
import music21 as m21

from MusicAnalyzer.session_handling import *


class Choice(View):
    form_class= FileForm
    template_name = "MusicAnalyzer/Choice.html"
    context_dict = {"heading": "Choose here"}

    def get(self, request):
        on_session_start(request)
        file_form = self.form_class()
        self.context_dict["file_form"] = file_form
        # information from the context dictionary can be referenced in the template
        test_corpus_search(request)
        return render(request, "MusicAnalyzer/Choice.html", self.context_dict)

    # handle data getting back from view
    def post(self, request):
        file_form = self.form_class(request.POST, request.FILES)
        files = request.FILES.getlist('files')
        if file_form.is_valid():
            for f in files:
                path = os.path.join(request.session.session_key, f.name)
                final_path = os.path.join(MEDIA_ROOT, path)
                default_storage.save(final_path, f)
                music = m21.converter.parse(os.path.join(MEDIA_ROOT, path)) #  this line of code should possibly only be done, once user has decided to really analyze this piece of music
                #TODO: handle errors for wrong file formats
                data = {'is_valid': True, 'name': f.name}
            #return render(request, "MusicAnalyzer/Choice.html", self.context_dict)
        else:
            self.context_dict.update({"message": "form not valid", "file_form": file_form})
            #return render(request, "MusicAnalyzer/Choice.html", self.context_dict)
            data = {'is_valid':False}
        return JsonResponse(data)


def test_corpus_search(request):
    #works
    #localCorpus = m21.corpus.corpora.LocalCorpus()
    #path = os.path.join(MEDIA_ROOT, request.session.session_key )
    #localCorpus.addPath(path)
    #print(localCorpus.directoryPaths)
    #print(localCorpus.metadataBundle)
    #results = localCorpus.search("Beethoven")
    #print(results[0])

    coreCorpus = m21.corpus.corpora.CoreCorpus
    path = os.path.join(BASE_DIR, "venv\Lib\site-packages\music21\corpus\\airdsAirs")
    test = metadata.bundles.MetadataBundle('core')
    print(test)
    print(m21.corpus.search(query="bach"))