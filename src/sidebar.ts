import * as vscode from "vscode";

export class SidebarProvider implements vscode.WebviewViewProvider {
	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// 웹뷰에서 받은 메시지 처리
		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "showProblem":
					vscode.commands.executeCommand("BOJ-EX.showProblem");
					break;
				case "headerComment":
					vscode.commands.executeCommand("BOJ-EX.headerComment");
					break;
				case "createProblem":
					vscode.commands.executeCommand("BOJ-EX.createProblem");
					break;
				case "pushToGithub":
					vscode.commands.executeCommand("BOJ-EX.pushToGithub");
					break;
				case "makeWorkflow":
					vscode.commands.executeCommand("BOJ-EX.makeWorkflow");
					break;
				case "showManual":
					vscode.commands.executeCommand("BOJ-EX.showManual");
					break;
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		return `<!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BOJ-EX</title>
      <style>
        body {
          padding: 15px;
          color: var(--vscode-foreground);
          font-family: var(--vscode-font-family);
          background-color: var(--vscode-editor-background);
        }
        
        .container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .card {
          background-color: var(--vscode-editor-background);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid var(--vscode-panel-border);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        button {
          width: 100%;
          padding: 12px 15px;
          display: flex;
          align-items: center;
          background-color: transparent;
          color: var(--vscode-foreground);
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 13px;
          transition: background-color 0.2s;
        }
        
        button:hover {
          background-color: var(--vscode-list-hoverBackground);
        }
        
        button:active {
          background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        .icon {
          display: inline-flex;
          margin-right: 10px;
          width: 16px;
          height: 16px;
          align-items: center;
          justify-content: center;
        }
        
        .title {
          margin-bottom: 20px;
          padding-bottom: 10px;
          font-size: 1.2em;
          font-weight: 600;
          border-bottom: 1px solid var(--vscode-panel-border);
          color: var(--vscode-panelTitle-activeForeground);
        }
      </style>
    </head>
    <body>
      <div class="title">백준 온라인 저지</div>
      
      <div class="container">
        <div class="card">
          <button id="showProblem">
            <span class="icon">📝</span>
            문제 보기
          </button>
        </div>
        
        <div class="card">
          <button id="createProblem">
            <span class="icon">➕</span>
            문제 생성
          </button>
        </div>
        
        <div class="card">
          <button id="headerComment">
            <span class="icon">✏️</span>
            헤더 코멘트 삽입
          </button>
        </div>
        
        <div class="card">
          <button id="pushToGithub">
            <span class="icon">🚀</span>
            GitHub에 푸시
          </button>
        </div>
        
        <div class="card">
          <button id="makeWorkflow">
            <span class="icon">⚙️</span>
            워크플로우 생성
          </button>
        </div>
        
        <div class="card">
          <button id="showManual">
            <span class="icon">📚</span>
            매뉴얼 보기
          </button>
        </div>
      </div>

      <script>
        (function() {
          const vscode = acquireVsCodeApi();
          
          document.getElementById('showProblem').addEventListener('click', () => {
            vscode.postMessage({ type: 'showProblem' });
          });
          
          document.getElementById('createProblem').addEventListener('click', () => {
            vscode.postMessage({ type: 'createProblem' });
          });
          
          document.getElementById('headerComment').addEventListener('click', () => {
            vscode.postMessage({ type: 'headerComment' });
          });
          
          document.getElementById('pushToGithub').addEventListener('click', () => {
            vscode.postMessage({ type: 'pushToGithub' });
          });
          
          document.getElementById('makeWorkflow').addEventListener('click', () => {
            vscode.postMessage({ type: 'makeWorkflow' });
          });
          
          document.getElementById('showManual').addEventListener('click', () => {
            vscode.postMessage({ type: 'showManual' });
          });
        }())
      </script>
    </body>
    </html>`;
	}
}
