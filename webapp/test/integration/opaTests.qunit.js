sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'cyclecounting/test/integration/FirstJourney',
		'cyclecounting/test/integration/pages/im_countingMain'
    ],
    function(JourneyRunner, opaJourney, im_countingMain) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('cyclecounting') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheim_countingMain: im_countingMain
                }
            },
            opaJourney.run
        );
    }
);