import os
from pathlib import WindowsPath, PosixPath

import matplotlib.pyplot as plt
from django.core.files.storage import default_storage
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect
from django.views import View
from music21 import metadata
from music21.converter import ConverterFileException
from music21.musicxml import m21ToXml
from music21.stream import Opus

from DH_201819_MusicAnalysis import settings
from DH_201819_MusicAnalysis.settings import MEDIA_ROOT
from MusicAnalyzer import constants
from MusicAnalyzer.forms import *
import music21 as m21

from MusicAnalyzer.session_handling import *

plt.ioff()  # turn off interactive matplotlib


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
        self.state = request.POST.get("state", "")
        if self.state == constants.STATE_SEARCH_CORPUS:
            if request.is_ajax():
                return search_corpus(request, context)
        elif self.state == constants.STATE_SELECT_FOR_ANALYSIS:
            selecteds = request.POST.getlist("music_piece", None)
            if selecteds is not None:
                music_pieces_list = []
                for select in selecteds:
                    if select == "select all":
                        continue
                    else:
                        file_source = get_file_source(select)
                        parts = select.split(get_source_dependant_prefix(file_source))[1].split("__number__")
                        path = parts[0]
                        number = get_int_or_none(parts[1])
                        if context == constants.INDIVIDUAL:
                            save_music_choice_to_cookie(request,
                                                        transform_music_source_to_dict(path, number, file_source))
                            # can do this directly in for, because in individual analysis only one music piece is analysed
                            return redirect("MusicAnalyzer:individual_analysis")
                        elif context == constants.DISTANT_HEARING:
                            music_pieces_list.append(transform_music_source_to_dict(path, number, file_source))

                            # either: pass the data to the analysis view, analyze there
                            # or: analyse the data and pass the results to the analysis view
                            #       (probably takes longer to load on first time,
                            #        but doesn't require loading when switching tabs)

                if context == constants.DISTANT_HEARING:
                    save_music_choice_to_cookie(request, music_pieces_list)
                    return redirect("MusicAnalyzer:distant_analysis")

                # if context == constants.INDIVIDUAL:
                #   save_parsed_file_to_cookie(request, parsed_file)
                #  return redirect("MusicAnalyzer:individual_analysis")

                # HttpResponse("Todo: process analysis here: " + str(
                # request.POST.get("music_piece", "")))  # TODO: delete this once more implemented
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


class DistantAnalysis(View):

    def get(self, request):
        music_pieces = access_music_choice_from_cookie(
            request)  # make this instance variable and only change when updated
        # TODO analyse data for at least first tab here
        return render(request, "MusicAnalyzer/DistantAnalysis.html", {"music_pieces": music_pieces})


class IndividualAnalysis(View):

    def get(self, request):
        # parsed_file = access_save_parsed_file_from_cookie(request)
        # parsed_file = m21.converter.thaw(parsed_file)
        choice = access_music_choice_from_cookie(request)
        parsed_file = parse_file(choice.get("path", ""), choice.get("number", None), choice.get("file_source", None))
        # plot = m21.graph.plot.HistogramPitchSpace(parsed_file) # example for use of music21 plots

        chord_information = get_chord_information(parsed_file)
        chordified_file = chord_information["chords"]
        parsed_file.insert(0, chordified_file)  # add the chords (and chordified score) to score
        print(parsed_file)
        gex = m21ToXml.GeneralObjectExporter()
        parsed_file = gex.parse(parsed_file).decode('utf-8')
        context_dict = {"music_pieces": parsed_file,
                        "chord_names": chord_information["chord_name_count"],
                        "chord_qualities": chord_information["chord_quality_count"],
                        "chord_roots": chord_information["chord_root_count"]
                        }
        return render(request, "MusicAnalyzer/IndividualAnalysis.html", context_dict)


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
                if isinstance(music, m21.stream.Opus):
                    music = music.mergeScores()
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
                data = {"is_valid": False,
                        "error_message": "This file format cannot be parsed. Please try a different one."}
            except ValueError:
                data = {"is_valid": False,
                        "error_message": "Something went wrong with the file upload. Perhaps your file is broken."}
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
    if string == "null" or string is None or string == "undefined":
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


# params:
# file_source_constant to distinguish uploaded files from corpus files
# sourcePath and number attributes of MetadataEntry-object, or path to uploaded file
# returns a Music21object
def parse_file(source_path, number, file_source):
    if file_source == constants.CORPUS_FILE:
        if source_path is not None and number is not None:
            test = m21.corpus.parse(get_system_dependant_path(source_path), number)
            # test = m21.converter.freeze(test)
            return test
        elif source_path is not None:
            test = m21.corpus.parse(get_system_dependant_path(source_path))
            # test = m21.converter.freeze(test)
            return test
        else:
            return None
    elif file_source == constants.UPLOADED_FILE:
        if source_path is not None:
            test = m21.converter.parse(get_system_dependant_path(source_path))
            # test = m21.converter.freeze(test)
            return test
        else:
            return None


def get_file_source(source_path):
    if source_path.startswith("path_upload__"):
        return constants.UPLOADED_FILE
    elif source_path.startswith("path_search__"):
        return constants.CORPUS_FILE
    else:
        return None


def get_source_dependant_prefix(source):
    if source == constants.UPLOADED_FILE:
        return "path_upload__"
    elif source == constants.CORPUS_FILE:
        return "path_search__"
    else:
        return "path__"


def transform_music_source_to_dict(path, number, file_source):
    music_piece = {"path": path, "number": number, "file_source": file_source}
    return music_piece


def get_interval_between_highest_and_lowest_pitch(stream):
    return stream.analyze('ambitus')


# get chords and summary stats on chords from parsed file
# params: a parsed file (music21 Stream object)
# returns: a dictionary containing:
# * a stream object of the chordified file
# * 3 dictionaries containing summary stats on the number of chords with a certain name, root or chord quality
# additional info:
# name is the pitched common name of a chord
# root is the basis upon which a chord builds up
# chord quality is something like minor, major, diminished etc.
def get_chord_information(parsed_file):
    chords = parsed_file.chordify()
    chords_names = {}
    chords_qualities = {}
    chords_roots = {}

    for chord in chords.recurse().getElementsByClass('Chord'):
        root = chord.root()
        if chord.quality in chords_qualities:
            chords_qualities[chord.quality] += 1
        else:
            chords_qualities[chord.quality] = 1

        if chord.pitchedCommonName in chords_names:
            chords_names[chord.pitchedCommonName] += 1
        else:
            chords_names[chord.pitchedCommonName] = 1
        chord.addLyric(get_chord_representation(chord))

        if root in chords_roots:
            chords_roots[root] += 1
        else:
            chords_roots[root] = 1

    return {"chords": chords,
            "chord_name_count": chords_names,
            "chord_quality_count": chords_qualities,
            "chord_root_count": chords_roots}


# get a chord symbol to display above the music
# ideally this is something like Am, C7 or similiar
# if chord symbol cannot be identified, get a more verbose name
def get_chord_representation(chord):
    chord_figure = m21.harmony.chordSymbolFigureFromChord(chord, True)
    if chord_figure[0] == 'Chord Symbol Cannot Be Identified':
        return chord.pitchedCommonName
    else:
        return chord_figure[0]


# saves a plot object to disk (to allow for it to be passed to the frontend)
# TODO: need to decide on naming scheme for plots and adjust path accordingly
def save_plot_to_disk(request, plot):
    plot.doneAction = None
    plot.run()
    path = os.path.join(settings.MEDIA_ROOT, request.session.session_key, "graphs", "test.png")
    plot.figure.savefig(path)
    return path
