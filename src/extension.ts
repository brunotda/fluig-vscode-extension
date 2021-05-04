// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { posix } from "path";
import { readFileSync, statSync } from "fs";
import { ServerItem, ServerItemProvider } from "./providers/ServerItemProvider";
import { glob } from "glob";

interface ExtensionsPath {
    TEMPLATES: string,
    FORM_EVENTS: string,
    WORKFLOW_EVENTS: string,
    GLOBAL_EVENTS: string
}

interface EventsNames {
    FORM: string[],
    WORKFLOW: string[],
    GLOBAL: string[]
}

const EXTENSION_PATHS: ExtensionsPath = {
    TEMPLATES: '',
    FORM_EVENTS: '',
    WORKFLOW_EVENTS: '',
    GLOBAL_EVENTS: ''
};


const EVENTS_NAMES: EventsNames = {
    FORM: [],
    WORKFLOW: [],
    GLOBAL: []
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand("fluig-vscode-extension.newDataset", createDataset)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("fluig-vscode-extension.newForm", createForm)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("fluig-vscode-extension.newFormEvent", createFormEvent)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("fluig-vscode-extension.newWorkflowEvent", createWorkflowEvent)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("fluig-vscode-extension.newGlobalEvent", createGlobalEvent)
    );

    EXTENSION_PATHS.TEMPLATES = getTemplateDirectoryPath();
    EXTENSION_PATHS.FORM_EVENTS = posix.join(EXTENSION_PATHS.TEMPLATES, 'formEvents')
    EXTENSION_PATHS.WORKFLOW_EVENTS = posix.join(EXTENSION_PATHS.TEMPLATES, 'workflowEvents')
    EXTENSION_PATHS.GLOBAL_EVENTS = posix.join(EXTENSION_PATHS.TEMPLATES, 'globalEvents')

    EVENTS_NAMES.FORM = getTemplatesNameFromPath(EXTENSION_PATHS.FORM_EVENTS);
    EVENTS_NAMES.WORKFLOW = getTemplatesNameFromPath(EXTENSION_PATHS.WORKFLOW_EVENTS);
    EVENTS_NAMES.GLOBAL = getTemplatesNameFromPath(EXTENSION_PATHS.GLOBAL_EVENTS);
  
    const serverItemProvider = new ServerItemProvider(context);
    vscode.window.registerTreeDataProvider("fluig-vscode-extension.servers", serverItemProvider);
    context.subscriptions.push(
      vscode.commands.registerCommand("fluig-vscode-extension.addServer", () => serverItemProvider.add())
    );
  
    context.subscriptions.push(
      vscode.commands.registerCommand("fluig-vscode-extension.deleteServer", (serverItem: ServerItem) => serverItemProvider.delete(serverItem))
    );
  
    context.subscriptions.push(
      vscode.commands.registerCommand("fluig-vscode-extension.refreshServer", () => serverItemProvider.refresh())
    );
  
    context.subscriptions.push(
      vscode.commands.registerCommand("fluig-vscode-extension.editServer", (serverItem: ServerItem) => serverItemProvider.update(serverItem))
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}

/**
 * Cria um arquivo contendo um novo Dataset
 */
async function createDataset() {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showInformationMessage("Você precisa estar em um diretório / workspace.");
        return;
    }

    let dataset:string = await vscode.window.showInputBox({
        prompt: "Qual o nome do Dataset (sem espaços e sem caracteres especiais)?",
        placeHolder: "ds_nome_dataset"
    }) || "";

    if (!dataset) {
        return;
    }

    if (!dataset.endsWith(".js")) {
        dataset += ".js";
    }

    const workspaceFolderUri = vscode.workspace.workspaceFolders[0].uri;
    const datasetUri = workspaceFolderUri.with({ path: posix.join(workspaceFolderUri.path, "datasets", dataset) });

    try {
        await vscode.workspace.fs.stat(datasetUri);
        return vscode.window.showTextDocument(datasetUri);
    } catch (err) {

    }

    await vscode.workspace.fs.writeFile(
        datasetUri,
        readFileSync(posix.join(EXTENSION_PATHS.TEMPLATES, 'createDataset.txt'))
    );
    vscode.window.showTextDocument(datasetUri);
}

/**
 * Cria um novo formulário
 */
async function createForm() {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showInformationMessage("Você precisa estar em um diretório / workspace.");
        return;
    }

    let formName:string = await vscode.window.showInputBox({
        prompt: "Qual o nome do Formulário (sem espaços e sem caracteres especiais)?",
        placeHolder: "NomeFormulario"
    }) || "";

    if (!formName) {
        return;
    }

    const formFileName = formName + ".html";
    const workspaceFolderUri = vscode.workspace.workspaceFolders[0].uri;
    const formUri = workspaceFolderUri.with({ path: posix.join(workspaceFolderUri.path, "forms", formName, formFileName) });

    try {
        await vscode.workspace.fs.stat(formUri);
        return vscode.window.showTextDocument(formUri);
    } catch (err) {

    }

    await vscode.workspace.fs.writeFile(formUri, readFileSync(posix.join(EXTENSION_PATHS.TEMPLATES, 'form.txt')));
    vscode.window.showTextDocument(formUri);
}

/**
 * Cria um novo evento de formulário
 */
async function createFormEvent(folderUri: vscode.Uri) {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showInformationMessage("Você precisa estar em um diretório / workspace.");
        return;
    }

    if (!folderUri.path.includes("/forms/")) {
        vscode.window.showErrorMessage("Necessário selecionar um formulário para criar o evento.");
        return;
    }

    const formName:string = folderUri.path.replace(/.*\/forms\/([^/]+).*/, "$1");

    const eventName: string = await vscode.window.showQuickPick(
        EVENTS_NAMES.FORM,
        {
            canPickMany: false,
            placeHolder: "Selecione o Evento"
        }
    ) || "";

    if (!eventName) {
        return;
    }

    const eventFilename = eventName + ".js";
    const workspaceFolderUri = vscode.workspace.workspaceFolders[0].uri;
    const eventUri = workspaceFolderUri.with({
        path: posix.join(
            workspaceFolderUri.path,
            "forms",
            formName,
            'events',
            eventFilename
        )
    });

    try {
        await vscode.workspace.fs.stat(eventUri);
        return vscode.window.showTextDocument(eventUri);
    } catch (err) {

    }

    await vscode.workspace.fs.writeFile(
        eventUri,
        readFileSync(posix.join(EXTENSION_PATHS.FORM_EVENTS, `${eventName}.txt`))
    );
    vscode.window.showTextDocument(eventUri);
}

/**
 * Cria um novo evento Global
 */
async function createGlobalEvent(folderUri: vscode.Uri) {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showInformationMessage("Você precisa estar em um diretório / workspace.");
        return;
    }

    const eventName: string = await vscode.window.showQuickPick(
        EVENTS_NAMES.GLOBAL,
        {
            canPickMany: false,
            placeHolder: "Selecione o Evento"
        }
    ) || "";

    if (!eventName) {
        return;
    }

    const eventFilename = eventName + ".js";
    const workspaceFolderUri = vscode.workspace.workspaceFolders[0].uri;
    const eventUri = workspaceFolderUri.with({
        path: posix.join(
            workspaceFolderUri.path,
            "events",
            eventFilename
        )
    });

    try {
        await vscode.workspace.fs.stat(eventUri);
        return vscode.window.showTextDocument(eventUri);
    } catch (err) {

    }

    await vscode.workspace.fs.writeFile(
        eventUri,
        readFileSync(posix.join(EXTENSION_PATHS.GLOBAL_EVENTS, `${eventName}.txt`))
    );
    vscode.window.showTextDocument(eventUri);
}

/**
 * Cria um novo evento de Processo
 */
async function createWorkflowEvent(folderUri: vscode.Uri) {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showInformationMessage("Você precisa estar em um diretório / workspace.");
        return;
    }

    if (!folderUri.path.endsWith(".process")) {
        vscode.window.showErrorMessage("Necessário selecionar um Processo para criar o evento.");
        return;
    }

    const newFunctionOption = 'Nova Função';

    let eventName: string = await vscode.window.showQuickPick(
        EVENTS_NAMES.WORKFLOW.concat(newFunctionOption),
        {
            canPickMany: false,
            placeHolder: "Selecione o Evento"
        }
    ) || "";

    if (!eventName) {
        return;
    }

    let isNewFunction = false;

    if (eventName == newFunctionOption) {
        eventName = await vscode.window.showInputBox({
            prompt: "Qual o nome da Nova Função (sem espaços e sem caracteres especiais)?",
            placeHolder: "nomeFuncao"
        }) || "";

        if (!eventName) {
            return;
        }

        isNewFunction = true;
    }

    const processName:string = folderUri.path.replace(/.*\/(\w+)\.process$/, "$1");
    const eventFilename = `${processName}.${eventName}.js`;
    const workspaceFolderUri = vscode.workspace.workspaceFolders[0].uri;
    const eventUri = workspaceFolderUri.with({
        path: posix.join(
            workspaceFolderUri.path,
            "workflow",
            "scripts",
            eventFilename
        )
    });

    try {
        await vscode.workspace.fs.stat(eventUri);
        return vscode.window.showTextDocument(eventUri);
    } catch (err) {

    }

    await vscode.workspace.fs.writeFile(
        eventUri,
        isNewFunction
            ? Buffer.from(createEmptyFunction(eventName), "utf-8")
            : readFileSync(posix.join(EXTENSION_PATHS.WORKFLOW_EVENTS, `${eventName}.txt`))
    );
    vscode.window.showTextDocument(eventUri);
}

/**
 * Pega o diretório de templates da Extensão
 *
 * @returns O caminho do diretório de templates da Extensão
 */
 function getTemplateDirectoryPath(): string {
    const path = vscode.extensions.getExtension("BrunoGasparetto.fluig-vscode-extension")?.extensionPath;

    if (!path) {
        throw "Não foi possível encontrar o diretório de templates.";
    }

    return posix.join(path, 'templates');
}

/**
 * Pega o nome dos templates de determinado diretório
 *
 * @param path Diretório onde estão os templates
 * @returns Nome dos arquivos sem a extensão
 */
function getTemplatesNameFromPath(path: string): string[] {
    return glob.sync(posix.join(path, '*.txt'))
        .map(filename => posix.basename(filename).replace(/([^.]+)\.txt/, '$1'));
}

/**
 * Cria o conteúdo de função compartilhada no processo
 *
 * @param functionName Nome da Função
 * @returns Definição da função
 */
function createEmptyFunction(functionName: string): string {
    return `/**
 *
 *
 */
function ${functionName}() {

}

`;
}
