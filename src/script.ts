import {MendixSdkClient, Project, OnlineWorkingCopy, Revision, Branch} from 'mendixplatformsdk/dist';
import {utils} from 'mendixmodelsdk/dist';
import when = require('when');
import config = require('./config.json');
import fs = require('fs');
var path = require('path');

const client = new MendixSdkClient(config.auth.username, config.auth.apikey);
const project = new Project(client,config.project.id, config.project.name);
const revision = new Revision(-1, new Branch(project,config.project.branch)); // always use the latest revision

async function serialize(){
    const wc : OnlineWorkingCopy = await client.platform().createOnlineWorkingCopy(project, revision);
    
    const projectName = wc.project().name();
    const projectPath = `./out/${projectName}`;

    if( fs.existsSync(projectPath)){
        console.log("Project output folder ${projectPath} already exists. Please delete the project output folder and try again");
        return;    
    }

    fs.mkdirSync(projectPath);

    await exportConstants(wc, projectPath);
    await exportDomainModels(wc, projectPath);
    await exportEnumerations(wc, projectPath);
    await exportMicroflows(wc, projectPath);
    await exportPages(wc, projectPath);
    await exportSnippets(wc, projectPath);
}

serialize();

async function exportConstants(wc : OnlineWorkingCopy, basePath : string){
    const interfaceElements = wc.model().allConstants();

    for(const interfaceElement of interfaceElements){
        const element = await loadAsPromise(interfaceElement);
        
        var filepath = getSanitisedAndUniqueFilePath(basePath, `${element.qualifiedName} [CONSTANT]`,'_');
        fs.writeFileSync(filepath,utils.serializeToJs(element) );
    }
}

async function exportDomainModels(wc : OnlineWorkingCopy, basePath : string){
    const interfaceElements = wc.model().allDomainModels();

    for(const interfaceElement of interfaceElements){
        const element = await loadAsPromise(interfaceElement);
        
        var filepath = getSanitisedAndUniqueFilePath(basePath, `${element.containerAsModule.name} [DOMAIN MODEL]`,'_');
        fs.writeFileSync(filepath,utils.serializeToJs(element) );
    }
}

async function exportEnumerations(wc : OnlineWorkingCopy, basePath : string){
    const interfaceElements = wc.model().allEnumerations();    
    for(const interfaceElement of interfaceElements){
        const element = await loadAsPromise(interfaceElement);
        
        var filepath = getSanitisedAndUniqueFilePath(basePath, `${element.qualifiedName} [ENUMERATION]`,'_');
        fs.writeFileSync(filepath,utils.serializeToJs(element) );
    }
}

async function exportMicroflows(wc : OnlineWorkingCopy, basePath : string){
    const interfaceElements = wc.model().allMicroflows();

    for(const interfaceElement of interfaceElements){
        const element = await loadAsPromise(interfaceElement);        
        var filepath = getSanitisedAndUniqueFilePath(basePath, `${element.qualifiedName} [MICROFLOW]`,'_');
        fs.writeFileSync(filepath,utils.serializeToJs(element) );
    }
}

async function exportPages(wc : OnlineWorkingCopy, basePath : string){
    const interfaceElements = wc.model().allPages(); 

    for(const interfaceElement of interfaceElements){
        const element = await loadAsPromise(interfaceElement);        
        var filepath = getSanitisedAndUniqueFilePath(basePath, `${element.qualifiedName} [PAGE]`,'_');
        fs.writeFileSync(filepath,utils.serializeToJs(element) );
    } 
}

async function exportSnippets(wc : OnlineWorkingCopy, basePath : string){
    const interfaceElements = wc.model().allSnippets(); 

    for(const interfaceElement of interfaceElements){
        const element = await loadAsPromise(interfaceElement);        
        var filepath = getSanitisedAndUniqueFilePath(basePath, `${element.qualifiedName} [SNIPPET]`,'_');
        fs.writeFileSync(filepath,utils.serializeToJs(element) );
    }
}
    
function getSanitisedAndUniqueFilePath(basePath : string, filename : string | null, replaceValue : string, attempt : number = 1) : string {
    filename = filename || "";
    filename = filename.replace(/[/\\?%*:|"<>]/g, replaceValue);
    let filePath = path.join(basePath, filename);

    if(fs.existsSync(filePath)){
        filename = filename + `${attempt}`;
        filePath = getSanitisedAndUniqueFilePath(basePath, filename, replaceValue, attempt++);
    }

    return filePath;
}

interface Loadable<T> {
    load(callback: (result: T) => void): void;
}

function loadAsPromise<T>(loadable: Loadable<T>): when.Promise<T> {
    return when.promise<T>((resolve, reject) => loadable.load(resolve));
}
