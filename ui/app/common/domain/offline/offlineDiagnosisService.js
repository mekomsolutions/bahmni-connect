'use strict';

angular.module('bahmni.common.domain')
    .service('diagnosisService', ['$q', '$rootScope', 'offlineEncounterServiceStrategy', 'eventQueue', 'conceptDbService', 'offlineDbService',
        function ($q, $rootScope, offlineEncounterServiceStrategy, eventQueue, conceptDbService, offlineDbService) {
            var self = this;
            var filterAndSortDiagnosis = function (diagnoses) {
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

            this.searchForDiagnosisConcepts = function (searchTerm) {
                var deferred = $q.defer();
                var diagnoses = [];
                var classUuid = Bahmni.Common.Constants.diagnosisConceptClassUuid;
                conceptDbService.getConceptsByClassAndSearchTerm(classUuid, searchTerm).then(function (concepts) {
                    _.each(concepts, function (concept) {
                        diagnoses.push({
                            "conceptName": concept.name,
                            "conceptUuid": concept.uuid,
                            "matchedName": null
                        });
                    });
                    deferred.resolve({"data": diagnoses});
                });
                return deferred.promise;
            };

            this.deleteDiagnosis = function (diagnosis) {
                var event = {type: "deleteDiagnosis", obsUuid: diagnosis.existingObs ? diagnosis.existingObs : diagnosis.previousObs, dbName: offlineDbService.getCurrentDbName() };
                eventQueue.addToEventQueue(event);

                var deferred = $q.defer();
                diagnosis.voided = true;
                deferred.resolve({"data": diagnosis});
                return deferred.promise;
            };

            this.getDiagnosisConceptSet = function () {
                var deferred = $q.defer();
                conceptDbService.getConceptByName(Bahmni.Clinical.Constants.diagnosisObservationConceptName).then(function (concept) {
                    deferred.resolve({"data": {"results": [concept]}});
                });
                return deferred.promise;
            };

            this.getPastAndCurrentDiagnoses = function (patientUuid, encounterUuid) {
                var deferred = $q.defer();
                return self.getDiagnoses(patientUuid).then(function (response) {
                    var diagnosisMapper = new Bahmni.DiagnosisMapper($rootScope.diagnosisStatus);
                    var allDiagnoses = diagnosisMapper.mapDiagnoses(response.data);
                    var pastDiagnoses = diagnosisMapper.mapPastDiagnosis(allDiagnoses, encounterUuid);
                    var savedDiagnosesFromCurrentEncounter = diagnosisMapper.mapSavedDiagnosesFromCurrentEncounter(allDiagnoses, encounterUuid);
                    deferred.resolve({"pastDiagnoses": pastDiagnoses, "savedDiagnosesFromCurrentEncounter": savedDiagnosesFromCurrentEncounter});
                    return deferred.promise;
                });
            };

            this.populateDiagnosisInformation = function (patientUuid, consultation) {
                return this.getPastAndCurrentDiagnoses(patientUuid, consultation.encounterUuid).then(function (diagnosis) {
                    consultation.pastDiagnoses = diagnosis.pastDiagnoses;
                    consultation.savedDiagnosesFromCurrentEncounter = diagnosis.savedDiagnosesFromCurrentEncounter;
                    return consultation;
                });
            };
        }]);
