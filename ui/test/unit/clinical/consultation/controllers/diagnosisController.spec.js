describe("Diagnosis Controller", function () {
    var $scope, rootScope, contextChangeHandler,mockDiagnosisService, spinner, appService, mockAppDescriptor, q, deferred, mockDiagnosisData;

    beforeEach(module('bahmni.clinical'));
    beforeEach(module('bahmni.common.offline'));

    beforeEach(inject(function ($controller, $rootScope, $q, diagnosisService) {
        $scope = $rootScope.$new();
        rootScope = $rootScope;
        mockDiagnosisService = diagnosisService;
        q = $q;
        deferred = $q.defer();
        $scope.consultation = {
            "newlyAddedDiagnoses": [], preSaveHandler: new Bahmni.Clinical.Notifier()
        };
        rootScope.currentUser = {privileges: [{name: "app:clinical:deleteDiagnosis"}, {name: "app:clinical"}]};

        mockAppDescriptor = jasmine.createSpyObj('appDescriptor', ['getConfig']);
        mockAppDescriptor.getConfig.and.returnValue({value: true});

        appService = jasmine.createSpyObj('appService', ['getAppDescriptor']);
        appService.getAppDescriptor.and.returnValue(mockAppDescriptor);

        contextChangeHandler = jasmine.createSpyObj('contextChangeHandler', ['add']);

        spyOn(diagnosisService, 'getDiagnosisConceptSet').and.returnValue(deferred.promise);

        spyOn(diagnosisService, 'getPastAndCurrentDiagnoses').and.returnValue(deferred.promise);

        spinner = jasmine.createSpyObj('spinner', ['forPromise']);
        spinner.forPromise.and.callFake(function (param) {
            return {
                then: function () {
                    return {};
                }
            }
        });

        $scope.patient = {'uuid':'a-uuid-8754'}

        $controller('DiagnosisController', {
            $scope: $scope,
            $rootScope: rootScope,
            contextChangeHandler: contextChangeHandler,
            spinner: spinner,
            appService: appService,
            diagnosisService: mockDiagnosisService
        });
    }));

    describe("initialization", function () {
        it("should add placeHolder for new diagnosis", function () {
            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(1);
        });
        it("should call appService and set canDeleteDiagnosis,allowOnlyCodedDiagnosis", function () {
            expect(appService.getAppDescriptor).toHaveBeenCalled();
            expect(mockAppDescriptor.getConfig).toHaveBeenCalledWith("allowOnlyCodedDiagnosis");
            expect($scope.canDeleteDiagnosis).not.toBeUndefined();
            expect($scope.allowOnlyCodedDiagnosis).toBe(true);
        });

        it("should get diagnosis meta data and set isStatusConfigured", function () {
            expect(mockDiagnosisService.getDiagnosisConceptSet).toHaveBeenCalled();
            var diagnosisMetaData = {
                "data": {
                    "results": [{
                        "setMembers": [{"name": {"name": "Bahmni Diagnosis Status"}}]
                    }]
                }
            };
            deferred.resolve(diagnosisMetaData);
            $scope.$apply();
            expect($scope.isStatusConfigured).toBeTruthy();
            expect($scope.diagnosisMetaData).toBe(diagnosisMetaData.data.results[0]);
        });
    });

    describe("getDiagnosis()", function () {
        it("should make a call to diagnosis service searchForDiagnosisConcepts", function () {

            spyOn(mockDiagnosisService, 'searchForDiagnosisConcepts').and.returnValue(deferred.promise);

            $scope.getDiagnosis({term:"primary"});
            expect(mockDiagnosisService.searchForDiagnosisConcepts).toHaveBeenCalledWith("primary");

        });
    });


    describe("cleanOutDiagnosisList()", function () {
        it("should return a filtered diagnosis list without duplicates", function () {

            var mockDiagnosis1 = new Bahmni.Common.Domain.Diagnosis({"name": "Otitis", "uuid":"SomeUuid-9877"});

            var diagConcept1 = {
                "concept": {
                    "name": "Otitis",
                    "uuid": "SomeUuid-9877"
                }
            }
            
            var diagConcept2 = {
                "concept": {
                    "name": "Angina",
                    "uuid": "SomeUuid-2345"
                }
            }
            
            var data = [];
            data.push(diagConcept1, diagConcept2);
            var allDiagsResults = {};
            allDiagsResults.data = data;
            
            expect($scope.cleanOutDiagnosisList(data).length).toEqual(2)
            
            // Adding Diagnosis1 in the scope. Expecting diag1 to not be returned by cleanOutDiagnosisList() 
            $scope.consultation.newlyAddedDiagnoses.push(mockDiagnosis1)
            expect($scope.cleanOutDiagnosisList(data).length).toEqual(1)

            var diagConcept3 = {
                "concept": {
                    "name": "Dengue",
                    "uuid": "SomeUuid-7855"
                }
            }
            data.push(diagConcept3);

            expect($scope.cleanOutDiagnosisList(data).length).toEqual(2)
            expect($scope.cleanOutDiagnosisList(data)[0].concept.name).toEqual(diagConcept2.concept.name)
            expect($scope.cleanOutDiagnosisList(data)[1].concept.name).toEqual(diagConcept3.concept.name)
        })
    })

    describe('getAddNewDiagnosisMethod()', function() {
        it("should add the new diag to the $scope", function() {

            var mockDiagnosis = new Bahmni.Common.Domain.Diagnosis({"name": "Otitis", "uuid":"SomeUuid-9877"});
            // var mockDiagnosis = new Bahmni.Common.Domain.Diagnosis({"name": "Angina", "uuid":"SomeUuid-2345"});

            var diagConcept = {
                "concept": {
                    "name": "Otitis",
                    "uuid": "SomeUuid-9877"
                },
                "lookup": {
                    "name": "Otitis",
                    "uuid": "SomeUuid-9877"
                }
            }
            var data = [diagConcept];
            
            $scope.consultation.newlyAddedDiagnoses.push(mockDiagnosis)

            $scope.getAddNewDiagnosisMethod(mockDiagnosis)(diagConcept)
            expect($scope.consultation.newlyAddedDiagnoses[1]).toEqual(mockDiagnosis)
            expect($scope.consultation.newlyAddedDiagnoses.length).toEqual(2)
        })
    })

    describe("should validate the diagnosis", function(){
        it("should throw error message for duplicate diagnosis", function(){
            $scope.consultation.newlyAddedDiagnoses = [{codedAnswer:{name:"abc"}},{codedAnswer:{name:"abc"}}];
            $scope.checkInvalidDiagnoses();

            expect($scope.errorMessage).toBe("{{'CLINICAL_DUPLICATE_DIAGNOSIS_ERROR_MESSAGE' | translate }}");

        });

        it("should throw error message for duplicate diagnosis based on case insensitivity", function(){
            $scope.consultation.newlyAddedDiagnoses = [{codedAnswer:{name:"abc"}},{codedAnswer:{name:"AbC"}}];
            $scope.checkInvalidDiagnoses();

            expect($scope.errorMessage).toBe("{{'CLINICAL_DUPLICATE_DIAGNOSIS_ERROR_MESSAGE' | translate }}");

        })
    });

    describe("removing blank diagnosis", function() {
        it("happens when the presave handler is fired", function() {
            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(1);

            $scope.consultation.preSaveHandler.fire();
            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(0);
        });

        it("happens when the scope is destroyed", function() {
            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(1);

            $scope.$destroy();
            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(0);
        });

        it("should happen only once during the lifecycle of the controller", function() {
            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(1);

            $scope.consultation.preSaveHandler.fire();
            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(0);

            $scope.consultation.newlyAddedDiagnoses.push(new Bahmni.Common.Domain.Diagnosis(''));
            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(1);
            $scope.consultation.preSaveHandler.fire();

            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(1);
        });
        it("should happens when empty rows has been reset to one ", function() {
            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(1);

            $scope.consultation.preSaveHandler.fire();
            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(0);

            $scope.consultation.newlyAddedDiagnoses.push(new Bahmni.Common.Domain.Diagnosis(''));
            $scope.restEmptyRowsToOne(0)
            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(1);
            $scope.consultation.preSaveHandler.fire();

            expect($scope.consultation.newlyAddedDiagnoses.length).toBe(0);
        });
    });

    var mockDiagnosisConceptResponse = [
    { 
        "data": { 
            "results": [
            {
                'uuid': 'b056563c-5d0c-43e2-b646-29dfda7359cd',
                'name': {
                    'display': 'Otitis',
                    'uuid': '5ce2d785-4a52-4bab-a604-4d43bfe4a930',
                    'name': 'Otitis',
                    'locale': 'en',
                    'localePreferred': true,
                    'conceptNameType': 'FULLY_SPECIFIED'
                }
            }
            ] 
        },
        "name": "Otitis",
        "searchKey": 'OTITIS',
        "uuid": 'b056563c-5d0c-43e2-b646-29dfda7359cd',
        "parents": {
            "parentConcepts": []
        },
        "conceptClassUuid": '8d492774-c2cc-11de-8d13-0010c6dffd0f'
    },
    { 
        "data": { 
            "results": [
            {
                'uuid': '71971cb1-b1b1-4341-a03d-6fa220e1ec0f',
                'name': {
                    'display': 'Tuberculosis',
                    'uuid': 'c16201a0-8e65-4a30-9ed5-050c174d1f87',
                    'name': 'Tuberculosis',
                    'locale': 'en',
                    'localePreferred': true,
                    'conceptNameType': 'FULLY_SPECIFIED'
                }
            }
            ] 
        },
        "name": "Tuberculosis",
        "searchKey": 'TUBERCULOSIS',
        "uuid": '71971cb1-b1b1-4341-a03d-6fa220e1ec0f',
        "parents": {
            "parentConcepts": []
        },
        "conceptClassUuid": '8d492774-c2cc-11de-8d13-0010c6dffd0f'
    }
    ]
});