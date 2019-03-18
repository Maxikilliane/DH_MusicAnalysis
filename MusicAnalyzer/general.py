

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