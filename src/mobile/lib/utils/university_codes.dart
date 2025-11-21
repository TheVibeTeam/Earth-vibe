// Códigos de serie para universidades y facultades
class UniversityCodes {
  static const Map<String, String> universities = {
    'UPLA': 'Universidad Peruana Los Andes',
  };

  static const Map<String, String> faculties = {
    'ING-SIS': 'Ingeniería de Sistemas y Computación',
    'ING-AMB': 'Medio Ambiente',
  };

  static String? getUniversityName(String code) {
    return universities[code.toUpperCase()];
  }

  static String? getFacultyName(String code) {
    return faculties[code.toUpperCase()];
  }

  static String? getUniversityCode(String name) {
    return universities.entries
        .firstWhere((entry) => entry.value == name,
            orElse: () => MapEntry('', ''))
        .key;
  }

  static String? getFacultyCode(String name) {
    return faculties.entries
        .firstWhere((entry) => entry.value == name,
            orElse: () => MapEntry('', ''))
        .key;
  }

  static List<String> getUniversityCodes() {
    return universities.keys.toList()..sort();
  }

  static List<String> getFacultyCodes() {
    return faculties.keys.toList()..sort();
  }

  static List<String> getUniversityNames() {
    return universities.values.toList()..sort();
  }

  static List<String> getFacultyNames() {
    return faculties.values.toList()..sort();
  }

  static String formatUniversityOption(String code) {
    final name = universities[code];
    return name != null ? '$code - $name' : code;
  }

  static String formatFacultyOption(String code) {
    final name = faculties[code];
    return name != null ? '$code - $name' : code;
  }
}
