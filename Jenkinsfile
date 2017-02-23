node { 

    stage('Checkout project') {
        checkout scm
    }

    stage('Install dependencies') {
        sh 'npm install'
    }

    stage('Check code style') {
        try {
            sh 'eslint . --format=checkstyle > eslint.xml'
            step([
                $class: 'CheckStylePublisher',
                pattern: '**/eslint.xml',
                unstableTotalAll: '0',
                usePreviousBuildAsReference: true
            ])
        } catch(err) {
        }
    }

    stage('Run tests') {
        try {
            sh 'npm test'
        } catch(err) {
        }
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
