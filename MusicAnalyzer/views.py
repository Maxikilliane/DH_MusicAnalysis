import os

from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from music21 import metadata

from DH_201819_MusicAnalysis.settings import MEDIA_ROOT
from MusicAnalyzer.forms import *
import music21 as m21

from MusicAnalyzer.session_handling import *

# TODO clear table before search


class Choice(View):
    file_form_class = FileForm
    search_form_class = SearchForm
    template_name = "MusicAnalyzer/Choice.html"
    context_dict = {"heading": "Choose here"}

    def get(self, request):

        on_session_start(request)
        self.context_dict["file_form"] = self.file_form_class()
        self.context_dict["search_form"] = self.search_form_class()
        # information from the context dictionary can be referenced in the template
        return render(request, "MusicAnalyzer/Choice.html", self.context_dict)

    # handle data getting back from view
    def post(self, request):
        state = request.POST.get("state", "")
        if state == "search_corpus":
            print(request.is_ajax())
            if request.is_ajax():
                return search_corpus(request)
        else:
            return upload_files(self, request)


def search_corpus(request):
    print(request.POST)
    composer = request.POST.get('composer', "")
    title = request.POST.get('title', "")
    start_year = convert_str_to_int(request.POST.get('start_year', ""))
    end_year = convert_str_to_int(request.POST.get('end_year', ""))

    if end_year < start_year:
        data = {
            "error": "Negative year durations are not possible. Please alter the year fields."
        }
    else:
        my_corpus = m21.corpus.corpora.CoreCorpus()
        composer_results = get_composer_results(my_corpus, composer)
        title_results = get_title_results(my_corpus, title)
        year_results = get_year_results(my_corpus, start_year, end_year)
        total_search_results = and_without_empty([composer_results, title_results, year_results])

        result_list = []
        for result in total_search_results:
            result_dict = {"composer": result.metadata.composer,
                           "title":result.metadata.title,
                           "year":result.metadata.date
                           }
            result_list.append(result_dict)
        data = {"results": result_list}
    return JsonResponse(data)


def upload_files(self, request):
    file_form = self.file_form_class(request.POST, request.FILES)
    files = request.FILES.getlist('files')
    if file_form.is_valid():
        for f in files:
            path = os.path.join(request.session.session_key, f.name)
            final_path = os.path.join(MEDIA_ROOT, path)
            default_storage.save(final_path, f)
            music = m21.converter.parse(os.path.join(MEDIA_ROOT, path))  # this line of code should possibly only be done, once user has decided to really analyze this piece of music
            # TODO: handle errors for wrong file formats
            data = {'is_valid': True, 'name': f.name}
            return JsonResponse(data)
    else:
        self.context_dict.update({"message": "form not valid", "file_form": file_form})
        data = {'is_valid': False}
        return JsonResponse(data)


# was necessary due to bug before rebuild of core corpus under windows
def get_corpus():
    if os.name == "nt":
        return m21.corpus.corpora.CoreCorpus()
    else:
        return m21.corpus.corpora.CoreCorpus()


# searches for all composers in composer string (separated by space)
# returns the OR results of the searches
def get_composer_results(corpus, composer):
    composers = composer.split()
    if len(composers) == 0:
        return metadata.bundles.MetadataBundle()
    else:
        results = corpus.search(composers[0], "composer")

        for index, composer in enumerate(composers):
            print(index)
            if index != 0:
                results.union(corpus.search(composer, "composer"))
    return results


# this checks whether title should be included in a search
def get_title_results(corpus, title):
    if title != "" and title is not None and not title.isspace():
        return corpus.search(title, "title")
    else:
        return metadata.bundles.MetadataBundle()


# searches for all years between start_year and end_year
# returns the OR results of the searches
def get_year_results(corpus, start_year, end_year):
    if start_year == -1 and end_year == -1:
        return metadata.bundles.MetadataBundle()
    results = corpus.search(str(start_year), "date")
    for year in range(start_year+1, end_year):
        result = corpus.search(str(year), "date")
        results.union(result)
    return results


# first "deletes" any empty results
# then intersects the rest of the non-empty ones
def and_without_empty(result_list):
    results = []
    for item in result_list:
        if len(item) > 0:
            results.append(item)
    if len(results) > 0:
        final_result = results[0]
        for index, result in enumerate(results):
            if index > 0:
                final_result = final_result.intersection(result)
        return final_result
    else:
        return result_list[0]


# This is used to transform the form results from year fields to a form which makes them good search input
def convert_str_to_int(string):
    if string == "" or string.isspace() or string is None:
        return -1
    else:
        return int(string)
