'use strict';

describe("EncounterTransactionMapper", function () {

    describe("map", function () {
        var mapper;

        beforeEach(function () {
            mapper = new Bahmni.Clinical.EncounterTransactionMapper();
        });

        it('should set default visit type in encounter when there is no active visit', function () {
            var obs = {uuid: "obsUuid"};
            var defaultVisitType = "OPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], visitUuid: null };
            var patient = { uuid:"patientUuid"};
            
            var encounterData = mapper.map(consulation, patient, null, {}, null, defaultVisitType, false);

            expect(encounterData.visitType).toBe(defaultVisitType);
            expect(encounterData.providers).toEqual([{uuid: "provider-uuid"}]);
        });

        it('should not update encounterData with logged in location uuid in editEncounter mode', function(){
            var obs = {uuid: "obsUuid"};
            var defaultVisitType = "OPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid" };
            var patient = { uuid:"patientUuid"};

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {}, null, defaultVisitType, true);

            expect(encounterData.locationUuid).toBe("original-location-uuid");

        });

        it('should update encounterData with logged in location uuid when not in editEncounter mode', function(){
            var obs = {uuid: "obsUuid"};
            var defaultVisitType = "OPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid" };
            var patient = { uuid:"patientUuid"};

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {}, null, defaultVisitType, false);

            expect(encounterData.locationUuid).toBe("logged-in-location-uuid");

        });

        it('should update encounterData with default visit type if visit uuid is not set and not in retrospective mode either', function(){
            var obs = {uuid: "obsUuid"};
            var defaultVisitType = "OPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid" };
            var patient = { uuid:"patientUuid"};

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {}, null, defaultVisitType, false);

            expect(encounterData.visitType).toBe("OPD");

        });

        it('should update encounterData with default retrospective visit type if it is in retrospective mode either', function(){
            var obs = {uuid: "obsUuid"};
            var defaultRetrospectiveVisitType = "IPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid" };
            var patient = { uuid:"patientUuid"};

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {encounterDate : "2015-04-01"}, defaultRetrospectiveVisitType, null, false);

            expect(encounterData.visitType).toBe("IPD");

        });

        it('should keep the diagnoses codedAnswer uuid and name in encounterData.bahmniDiagnoses', function () {
            var diag1 = new Bahmni.Common.Domain.Diagnosis({name: "Dengue", uuid: "a-Uuid-1345"});
            var consultation = {
                newlyAddedDiagnoses: [diag1]
            };
            var patient = { uuid:"patientUuid"};
            
            var encounterData = mapper.map(consultation, patient);
            expect(encounterData.bahmniDiagnoses[0].codedAnswer.name).toBe(diag1.codedAnswer.name)
            expect(encounterData.bahmniDiagnoses[0].codedAnswer.uuid).toBe(diag1.codedAnswer.uuid)
        })

        it('should map the encounterUuid field to encounterData.bahmniDiagnoses', function () {

            var diag1 = new Bahmni.Common.Domain.Diagnosis({name: "Dengue", uuid: "a-Uuid-1345"}, "en-counter-uuid-1234");
            var consultation = {
                newlyAddedDiagnoses: [diag1]
            };
            var patient = { uuid:"patientUuid"};
            
            var encounterData = mapper.map(consultation, patient);
            expect(encounterData.bahmniDiagnoses[0].encounterUuid).toBe(diag1.encounterUuid)
        })

        it('should set program enrollment uuid as patient program uuid', function(){
            var obs = {uuid: "obsUuid"};
            var defaultRetrospectiveVisitType = "IPD";
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid" };
            var patient = { uuid:"patientUuid"};
            var patientProgramUuid = "someNiceUuid";

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {encounterDate : "2015-04-01"}, defaultRetrospectiveVisitType, null, false, patientProgramUuid);

            expect(encounterData.context.patientProgramUuid).toBe(patientProgramUuid);

        });

        it("should set urgency value to order if the urgency button is clicked", function() {
            var obs = {uuid: "obsUuid"};
            var defaultRetrospectiveVisitType = "IPD";
            var order = [{ concept: {uuid: "orders-uuid"}, isUrgent: true, uuid: undefined }];
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid", orders: order };
            var patient = { uuid:"patientUuid"};
            var patientProgramUuid = "someNiceUuid";

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {encounterDate : "2015-04-01"}, defaultRetrospectiveVisitType, null, false, patientProgramUuid);

            expect(encounterData.context.patientProgramUuid).toBe(patientProgramUuid);
            expect(encounterData.orders[0].urgency).toBe("STAT");
        });


        it("should not set urgency value to order if the urgency button is not clicked", function() {
            var obs = {uuid: "obsUuid"};
            var defaultRetrospectiveVisitType = "IPD";
            var order = [{ concept: {uuid: "orders-uuid"}, isUrgent: false, uuid: undefined }];
            var consulation = { observations: obs, providers: [{uuid: "provider-uuid"}], locationUuid: "original-location-uuid", orders: order };
            var patient = { uuid:"patientUuid"};
            var patientProgramUuid = "someNiceUuid";

            var encounterData = mapper.map(consulation, patient, "logged-in-location-uuid", {encounterDate : "2015-04-01"}, defaultRetrospectiveVisitType, null, false, patientProgramUuid);

            expect(encounterData.context.patientProgramUuid).toBe(patientProgramUuid);
            expect(encounterData.orders[0].urgency).toBe(undefined);
        });
    });
});

