import * as vscode from 'vscode';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { showProblem } from './showProblem';
import { headerComment } from './headerComment';

export function createProblem(context: vscode.ExtensionContext)
{
    vscode.window.showInputBox({ prompt: '문제 번호를 입력해주세요.', placeHolder: '예: 1000' }).then(async problemNumber =>
    {
        if (!problemNumber)
        {
            vscode.window.showErrorMessage('문제 번호가 입력되지 않았습니다.');
            return;
        }

        try
        {
            const config = vscode.workspace.getConfiguration('BOJ');
            const extension = config.get<string>('extension', '');

            const response = await axios.get(`https://www.acmicpc.net/problem/${problemNumber}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                },
                responseType: 'arraybuffer', // Response 데이터를 바이너리 데이터로 받도록 설정
            });

            const htmlData = response.data.toString('utf-8'); // 바이너리 데이터를 문자열로 변환

            // Cheerio를 사용하여 HTML 파싱
            const $ = cheerio.load(htmlData);

            // 제목 추출
            const problemName = $('title').text();

            // 파일명 생성
            const fileName = `${problemName}.${extension}`;

            const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, fileName);
            // 파일이 이미 존재하는지 확인
            try
            {
                await vscode.workspace.fs.stat(uri);
                vscode.window.showErrorMessage(`File '${fileName}' already exists.`);
                return;
            } catch (error)
            {
                // stat 메서드에서 오류가 발생하면 파일이 존재하지 않는 것이므로 계속 진행
            }

            // 파일 생성
            await vscode.workspace.fs.writeFile(uri, new Uint8Array());

            // 왼쪽 분할 화면에 텍스트 에디터를 열기
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.One });

            // 완료 메시지 표시
            vscode.window.showInformationMessage(`Problem ${problemNumber} created successfully.`);

            showProblem(problemNumber, context);
            headerComment(problemNumber);
        }
        catch (error)
        {
            vscode.window.showErrorMessage('문제를 찾을 수 없습니다.');
            console.log(error);
            return;
        }
    });

}