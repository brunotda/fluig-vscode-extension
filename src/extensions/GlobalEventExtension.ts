import * as vscode from 'vscode';
import {GlobalEventService} from "../services/GlobalEventService";
import {TemplateService} from "../services/TemplateService";
import {UtilsService} from "../services/UtilsService";
import {readFileSync} from "fs";

export class GlobalEventExtension {

    public static activate(context: vscode.ExtensionContext): void {
        context.subscriptions.push(vscode.commands.registerCommand(
            "fluiggers-fluig-vscode-extension.newGlobalEvent",
            GlobalEventExtension.createGlobalEvent
        ));
        context.subscriptions.push(vscode.commands.registerCommand(
            "fluiggers-fluig-vscode-extension.importManyGlobalEvent",
            GlobalEventService.importMany
        ));
        context.subscriptions.push(vscode.commands.registerCommand(
            "fluiggers-fluig-vscode-extension.importGlobalEvent",
            GlobalEventService.import
        ));
    }

    /**
     * Cria um Evento Global
     */
    private static async createGlobalEvent() {
        const eventName: string = await vscode.window.showQuickPick(
            TemplateService.globalEventsNames,
            {
                canPickMany: false,
                placeHolder: "Selecione o Evento"
            }
        ) || "";

        if (!eventName) {
            return;
        }

        const eventFilename = eventName + ".js";
        const eventUri = vscode.Uri.joinPath(
            UtilsService.getWorkspaceUri(),
            "events",
            eventFilename
        );

        try {
            // Se Evento já existe carrega o arquivo no editor
            await vscode.workspace.fs.stat(eventUri);
            return vscode.window.showTextDocument(eventUri);
        } catch (err) {

        }

        await vscode.workspace.fs.writeFile(
            eventUri,
            readFileSync(vscode.Uri.joinPath(TemplateService.globalEventsUri, `${eventName}.txt`).fsPath)
        );
        vscode.window.showTextDocument(eventUri);
    }
}
