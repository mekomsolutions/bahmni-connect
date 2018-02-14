'use strict';

angular.module('bahmni.common.domain')
    .service('diagnosisService', ['$q', 'offlineEncounterServiceStrategy', 'conceptDbService',
        function ($q, offlineEncounterServiceStrategy, conceptDbService) {
            var filterAndSortDiagnosis = function (diagnoses) {
                diagnoses = _.filter(diagnoses, function (singleDiagnosis) {
                    return singleDiagnosis.revised == false;
                });
                diagnoses = _.sortBy(diagnoses, 'diagnosisDateTime').reverse();
                return diagnoses;
            };

            this.getDiagnoses = function (patientUuid, visitUuid) {
                var deferred = $q.defer();
                var diagnoses = [];
                offlineEncounterServiceStrategy.getEncountersByPatientUuid(patientUuid).then(function (results) {
                    _.each(results, function (result) {
                        if (result.encounter.bahmniDiagnoses) {
                            diagnoses = diagnoses.concat(result.encounter.bahmniDiagnoses);
                        }
                    });
                    diagnoses = filterAndSortDiagnosis(diagnoses);
                    deferred.resolve({"data": diagnoses});
                });
                return deferred.promise;
            };

            // Searches for diagnoses concepts
            this.getAllFor = function (searchTerm) {
                var deferred = $q.defer();
                var diags = [];
                var classUuid = Bahmni.Common.Constants.diagnosisConceptClassUuid;
                conceptDbService.getConceptByClassAndSearchTerm(classUuid, searchTerm).then(function (results) {
                    deferred.resolve({"data": results});
                });
                return deferred.promise;
            };

            this.deleteDiagnosis = function (obsUuid) {
                return $q.when({"data": {}});
            };

            this.getDiagnosisConceptSet = function () {
                return $q.when({"data": {}});
            };

            this.getPastAndCurrentDiagnoses = function (patientUuid, encounterUuid) {
                return $q.when({"data": {}});
            };

            this.populateDiagnosisInformation = function (patientUuid, consultation) {
                consultation.savedDiagnosesFromCurrentEncounter = [];
                consultation.pastDiagnoses = [];
                return $q.when(consultation);
            };
        }]);
