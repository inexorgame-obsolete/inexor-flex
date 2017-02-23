node { 

    stage('Checkout project') {
        checkout scm
    }

    stage('Install dependencies') {
        sh 'npm install'
    }

    stage('Check code style') {
        try {
            sh 'eslint . --format=checkstyle --output-file=eslint.xml'
        } catch(err) {
            echo "Error: ${err}";
        }
        step([
            $class: 'CheckStylePublisher',
            pattern: '**/eslint.xml',
            unstableTotalAll: '0',
            usePreviousBuildAsReference: true
        ])
    }

    stage('Run tests') {
        try {
            sh 'mocha $(find . -not -iwholename "*node_modules*" -iwholename "*test*" -name "*.js") --reporter mocha-junit-reporter --reporter-options mochaFile=./test-results.xml'
        } catch(err) {
            echo "Error: ${err}";
        }
        step([
            $class: 'JUnitResultArchiver',
            testResults: '**/test-results.xml'
        ])
    }

    stage('Generate API documentation') {
        sh 'jsdoc -c .jsdoc.json'
        publishHTML(target: [
            allowMissing: false,
            alwaysLinkToLastBuild: false,
            keepAll: true,
            reportDir: 'docs/',
            reportFiles: 'index.html',
            reportName: 'Inexor Flex API Documentation'
        ])
    }

}
