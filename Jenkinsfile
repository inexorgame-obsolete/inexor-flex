node { 

    stage('Checkout project') {
        checkout scm
    }

    stage('Install dependencies') {
        sh 'npm install'
    }

    stage('Run tests') {
        sh 'npm test'
    }

    stage('Generate API documentation') {
        sh 'jsdoc -c .jsdoc.json'
    }

}
