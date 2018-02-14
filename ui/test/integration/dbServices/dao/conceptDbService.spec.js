'use strict';

describe('conceptDbService tests', function () {
    var conceptDbService;
    var $q= Q;

    beforeEach(function () {
        module('bahmni.common.offline');
    });

    beforeEach(module(function ($provide) {
        $provide.value('$q', $q);
    }));

    beforeEach(inject(['conceptDbService', function (conceptDbServiceInjected) {
        conceptDbService = conceptDbServiceInjected
    }]));

    it("should update children of concept if there are setmembers", function(done){
        var schemaBuilder = lf.schema.create('conceptMetadata', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.MetaDataSchemaDefinitions.Concept);
        jasmine.getFixtures().fixturesPath = 'base/test/data';
        var conceptJson = JSON.parse(readFixtures('concept.json'));
        var uuid = "c36a7537-3f10-11e4-adec-0800271c1b75";
        var child1Uuid = "c36af094-3f10-11e4-adec-0800271c1b75";
        var child1Name = "Pulse Data";
        schemaBuilder.connect().then(function(db){
            conceptDbService.init(db);
            conceptDbService.insertConceptAndUpdateHierarchy(conceptJson).then(function(){
                conceptDbService.getConcept(uuid).then(function(result) {
                    expect(result.data).toBe(conceptJson);
                }).then(function() {
                    conceptDbService.getConcept(child1Uuid).then(function(result) {
                        expect(result.name).toBe(child1Name);
                        expect(result.parents.parentConcepts.length).toBe(1);
                        done();
                    })
                });
            });
        });
    });

    it("should add conceptClass and searchKey when insterting concepts", function (done) {
        var schemaBuilder = lf.schema.create('conceptMetadata', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.MetaDataSchemaDefinitions.Concept);
        jasmine.getFixtures().fixturesPath = 'base/test/data';

        var conceptJson = JSON.parse(readFixtures('concept.json'));
        var weightConceptJson = JSON.parse(readFixtures('weightConcept.json'));
        
        var vitalsUuid = "c36a7537-3f10-11e4-adec-0800271c1b75";
        var weightUuid = "bb0c3a50-d214-4cd5-9889-2d30e69330d3";
        
        var vitalsExpectedSearchKey = "VITALS";
        var weightExpectedSearchKey = "OTITIS";

        var miscConceptClassUuid = "8d492774-c2cc-11de-8d13-0010c6dffd0f";
        var diagConceptClassUuid = "924c5978-c966-480d-9356-7bba3d30775b";

        schemaBuilder.connect().then(function(db){
            conceptDbService.init(db);
            conceptDbService.insertConceptAndUpdateHierarchy(conceptJson).then(function(result){
                conceptDbService.getConcept(vitalsUuid).then(function(result) {
                    expect(result.conceptClassUuid).toEqual(miscConceptClassUuid);
                    expect(result.searchKey).toEqual(vitalsExpectedSearchKey);
                })
            }).then(function (result) {
                conceptDbService.insertConceptAndUpdateHierarchy(weightConceptJson).then(function(){
                   conceptDbService.getConcept(weightUuid).then(function(result) {
                    expect(result.conceptClassUuid).toEqual(diagConceptClassUuid);
                    expect(result.searchKey).toEqual(weightExpectedSearchKey);
                    done();
                })
               })
            })
        });
    });

    it("should fetch concepts by search term, filtered by a conceptClass", function (done) {
        var schemaBuilder = lf.schema.create('conceptMetadata', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.MetaDataSchemaDefinitions.Concept);
        jasmine.getFixtures().fixturesPath = 'base/test/data';

        var conceptJson = JSON.parse(readFixtures('concept.json'));
        var uuid = "c36a7537-3f10-11e4-adec-0800271c1b75";
        var miscConceptClassUuid = "8d492774-c2cc-11de-8d13-0010c6dffd0f";
        var diagConceptClassUuid = "924c5978-c966-480d-9356-7bba3d30775b";

        schemaBuilder.connect().then(function(db){
            conceptDbService.init(db);
            conceptDbService.insertConceptAndUpdateHierarchy(conceptJson).then(function(){
                conceptDbService.getConceptByClassAndSearchTerm(miscConceptClassUuid, "aterm").then(function(results){
                    expect(results.length).toBe(0);
                });
                conceptDbService.getConceptByClassAndSearchTerm(diagConceptClassUuid, "oti").then(function(results){
                    expect(results.length).toBe(1);
                });
                conceptDbService.getConceptByClassAndSearchTerm(miscConceptClassUuid, "vit").then(function(results){
                    expect(results.length).toBe(1);
                    done()
                });     
            })
        });
    });

    it("should return the root concept for any given child concept", function(done){
        var schemaBuilder = lf.schema.create('conceptMetadata', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.MetaDataSchemaDefinitions.Concept);
        jasmine.getFixtures().fixturesPath = 'base/test/data';
        var conceptJson = JSON.parse(readFixtures('concept.json'));
        var childConceptName = "RR Data";
        schemaBuilder.connect().then(function(db){
            conceptDbService.init(db);
            conceptDbService.insertConceptAndUpdateHierarchy(conceptJson).then(function(){
                conceptDbService.getAllParentsInHierarchy(childConceptName, []).then(function (result) {
                    expect(result).toEqual(['RR Data', 'Vitals']);
                });

                conceptDbService.getAllParentsInHierarchy(childConceptName, []).then(function (result) {
                    expect(result).toEqual(['RR Data', 'Vitals']);
                    done();
                });
            });
        });
    });

    it("should return the empty array if the given concept is not in db", function(done){
        var schemaBuilder = lf.schema.create('conceptMetadata', 1);
        Bahmni.Tests.OfflineDbUtils.createTable(schemaBuilder, Bahmni.Common.Offline.MetaDataSchemaDefinitions.Concept);
        jasmine.getFixtures().fixturesPath = 'base/test/data';
        var conceptJson = JSON.parse(readFixtures('concept.json'));
        var conceptName = "dummyConcept";
        schemaBuilder.connect().then(function(db){
            conceptDbService.init(db);
            conceptDbService.insertConceptAndUpdateHierarchy(conceptJson).then(function(){
                conceptDbService.getAllParentsInHierarchy(conceptName, []).then(function (result) {
                    expect(result).toEqual([]);
                    done();
                });
            });
        });
    });

});