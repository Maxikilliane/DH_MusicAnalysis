import os

from django.core.files.storage import default_storage
from django.http import JsonResponse
from music21.converter import ConverterFileException

from DH_201819_MusicAnalysis.settings import MEDIA_ROOT
from MusicAnalyzer import constants
import music21 as m21

from MusicAnalyzer.constants import Prefix
from MusicAnalyzer.forms import AddGroupForm
from MusicAnalyzer.general import convert_str_to_int, convert_none_to_empty_string
from MusicAnalyzer.models import DistantHearingGroup


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


# searches for all composers in composer string (separated by space)
# returns the OR results of the searches
def get_composer_results(corpus, composer):
    composers = composer.split()
    if len(composers) == 0:
        return m21.metadata.bundles.MetadataBundle()
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
        return m21.metadata.bundles.MetadataBundle()


# searches for all years between start_year and end_year
# returns the OR results of the searches
def get_year_results(corpus, start_year, end_year):
    if start_year == -1 and end_year == -1:
        return m21.metadata.bundles.MetadataBundle()
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
        return m21.metadata.bundles.MetadataBundle()
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


def upload_files(self, request, context):
    file_form = self.file_form_class(request.POST, request.FILES)

    files = request.FILES.getlist('files')

    if file_form.is_valid():
        for f in files:
            path = os.path.join(request.session.session_key, f.name)
            final_path = os.path.join(MEDIA_ROOT, path)
            default_storage.save(final_path, f)

            try:
                data = get_metadata_from_uploaded_files(context, final_path, True)
            except ConverterFileException:
                data = {"is_valid": False,
                        "error_message": "This file format cannot be parsed. Please try a different one."}

                os.remove(final_path)

            except ValueError:
                data = {"is_valid": False,
                        "error_message": "Something went wrong with the file upload. Perhaps your file is broken."}
                os.remove(final_path)
            return JsonResponse(data)
    else:
        self.context_dict.update({"message": "Form is not valid.", "file_form": file_form})
        data = {'is_valid': False}
        return JsonResponse(data)


def get_metadata_from_uploaded_files(context, final_path, is_new):
    music = m21.converter.parse(final_path)
    if isinstance(music, m21.stream.Opus):
        music = music.mergeScores()
    if is_new:
        data = get_metadata_for_newly_uploaded_files(final_path, context, music)
    else:
        data = get_metadata_for_previously_uploaded_files(final_path, context, music)
    if is_new:
        if context == constants.DISTANT_HEARING:
            data["delete_last"] = False
        else:
            data["delete_last"] = True

    return data


def get_metadata_for_previously_uploaded_files(final_path, context, music):
    metadata = get_relevant_metadata(music)
    metadata["path"] = final_path
    metadata["context"] = context
    metadata["is_valid"] = True
    return metadata


def get_metadata_for_newly_uploaded_files(final_path, context, music):
    upload = get_relevant_metadata(music)
    upload["path"] = final_path
    upload["context"] = context
    return {'is_valid': True, "upload": upload}


def get_relevant_metadata(music):
    return {'composer': convert_none_to_empty_string(music.metadata.composer),
            'title': convert_none_to_empty_string(music.metadata.title),
            'year': convert_none_to_empty_string(music.metadata.date)}


def add_group(request, context):
    add_group_form = AddGroupForm(request.POST, prefix=Prefix.add_group.value)
    if add_group_form.is_valid():
        name = add_group_form.cleaned_data.get("name", "")
        # TODO check if group name unique for this session
        new_group = DistantHearingGroup.objects.create(name=name, ref_django_session_id=request.session.session_key)
        return JsonResponse({"result": "success", "name": name, "id":new_group.pk})
    else:
        return JsonResponse({"result": "error", "error": "Form invalid!"})

def get_available_groups(request):
    groups = DistantHearingGroup.objects.filter(ref_django_session_id = request.session.session_key)
    groups_list = []
    for group in groups:
        groups_list.append({"name": group.name, "pk": group.pk})
    return groups_list