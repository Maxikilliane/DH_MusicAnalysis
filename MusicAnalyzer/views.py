import os
from pathlib import WindowsPath, PosixPath

from django.core.files.storage import default_storage
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from django.views import View
from music21 import metadata
from music21.converter import ConverterFileException

from DH_201819_MusicAnalysis.settings import MEDIA_ROOT
from MusicAnalyzer import constants
from MusicAnalyzer.forms import *
import music21 as m21

from MusicAnalyzer.session_handling import *


class Index(View):
    template_name = "MusicAnalyzer/Index.html"

    def get(self, request):
        on_session_start(request)
        # information from the context dictionary can be referenced in the template
        return render(request, "MusicAnalyzer/Index.html")


class Choice(View):
    file_form_class = FileForm
    search_form_class = SearchForm
    template_name = "MusicAnalyzer/Choice.html"
    context_dict = {"heading": "Individual Analysis"}
    state = ""

    def get(self, request):
        on_session_start(request)
        self.context_dict["file_form"] = self.file_form_class()
        self.context_dict["search_form"] = self.search_form_class()


    # handle data getting back from view
    def post(self, request, context):
        print(request.POST)
        self.state = request.POST.get("state", "")
        if self.state == constants.STATE_SEARCH_CORPUS:
            if request.is_ajax():
                return search_corpus(request, context)
        elif self.state == constants.STATE_SELECT_FOR_ANALYSIS:
            selecteds = request.POST.getlist("music_piece", None)
            if selecteds is not None:
                for select in selecteds:
                    if select == "select all":
                        continue
                    else:
                        parts = select.split("path__")[1].split("__number__")
                        path = parts[0]
                        number = get_int_or_none(parts[1])
                        if context == constants.INDIVIDUAL:
                            parsed = parse_from_metadata(path, number)
                            # display the parsed data as score/notes etc. (pass to vexflox or similiar)
                            # need to be sure that there is only one music piece (perhaps another check, but actually should be this way, because of radio select)
                        elif context == constants.DISTANT_HEARING:
                            # either: pass the data to the analysis view, probably as json, analyze there
                            # or: analyse the data and pass the results to the analysis view
                            #       (probably takes longer to load on first time,
                            #        but doesn't require loading when switching tabs)
                            pass

            return HttpResponse("Todo: process analysis here: "+str(request.POST.get("music_piece", "")))
        else:
            return upload_files(self, request, context)


class IndividualChoice(Choice):
    def get(self, request):
        super(IndividualChoice, self).get(request)
        self.context_dict["url"] = "MusicAnalyzer:individual_choice"
        self.context_dict["type"] = constants.INDIVIDUAL
        return render(request, self.template_name, self.context_dict)

    def post(self, request):
        return super(IndividualChoice, self).post(request, context=constants.INDIVIDUAL)


class DistantHearingChoice(Choice):
    file_form_class = MultipleFilesForm
    context_dict = {"heading": "Distant Hearing"}

    def get(self, request):
        super(DistantHearingChoice, self).get(request)
        self.context_dict["url"] = "MusicAnalyzer:distant_choice"
        self.context_dict["type"] = constants.DISTANT_HEARING
        return render(request, self.template_name, self.context_dict)

    def post(self, request):
        return super(DistantHearingChoice, self).post(request, context=constants.DISTANT_HEARING)


def search_corpus(request, context):
    free_search = request.POST.get("free_search", "")
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
        free_search_results = get_free_search_results(my_corpus, free_search)
        composer_results = get_composer_results(my_corpus, composer)
        title_results = get_title_results(my_corpus, title)
        year_results = get_year_results(my_corpus, start_year, end_year)
        total_search_results = and_without_empty([free_search_results, composer_results, title_results, year_results])

        result_list = []
        for result in total_search_results:
            result_dict = {"composer": result.metadata.composer,
                           "title": result.metadata.title,
                           "year": result.metadata.date,
                           "path": str(result.sourcePath),
                           "number": result.number
                           }

            result_list.append(result_dict)
        data = {"results": result_list, "context": context}
    return JsonResponse(data)


def upload_files(self, request, context):
    file_form = self.file_form_class(request.POST, request.FILES)

    files = request.FILES.getlist('files')

    if file_form.is_valid():
        for f in files:
            path = os.path.join(request.session.session_key, f.name)
            final_path = os.path.join(MEDIA_ROOT, path)
            default_storage.save(final_path, f)

            try:
                music = m21.converter.parse(os.path.join(MEDIA_ROOT,
                                                     path))
                data = {'is_valid': True, "upload": {
                    'composer': convert_none_to_empty_string(music.metadata.composer),
                    'title': convert_none_to_empty_string(music.metadata.title),
                    'year': convert_none_to_empty_string(music.metadata.date),
                    'path': final_path},
                        'context': context}
                if context == constants.DISTANT_HEARING:
                    data["delete_last"] = False
                else:
                    data["delete_last"] = True
                    print(data)
            except ConverterFileException:
                data={'is_valid': False,
                      "error_message": "This file format cannot be parsed. Please try a different one."}
            return JsonResponse(data)
    else:
        self.context_dict.update({"message": "Form is not valid.", "file_form": file_form})
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
    for year in range(start_year + 1, end_year):
        result = corpus.search(str(year), "date")
        results.union(result)
    return results

# searches in whole corpus for given terms
# returns the ORred results of the searches
def get_free_search_results(corpus, free_search):
    free_search = free_search.split()
    if len(free_search) == 0:
        return metadata.bundles.MetadataBundle()
    else:
        results = corpus.search(free_search[0])

        for index, term in enumerate(free_search):
            print(index)
            if index != 0:
                results.union(corpus.search(term))
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


def convert_none_to_empty_string(string):
    if string == 'None' or string is None:
        return ''
    else:
        return string


def get_int_or_none(string):
    if string == "null" or string is None:
        return None
    else:
        try:
            return int(string)
        except ValueError:
            return None



def get_system_dependant_path(path):
    if os.name == "nt":
        return WindowsPath(path)
    else:
        return PosixPath(path)


# params: sourcePath and number attributes of MetadataEntry-object
# returns a Music21object
def parse_from_metadata(source_path, number):
    if source_path is not None and number is not None:
        test = m21.corpus.parse(get_system_dependant_path(source_path), number)
        return test
        print(test)
    elif source_path is not None:
        test = m21.corpus.parse(get_system_dependant_path(source_path))
        return test
        print(test)
    else:
        print("Noooooo:")
        return None