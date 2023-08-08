import * as vscode from 'vscode';

export async function headerComment(problemNumber: string)
{
    if (hasHeaderComment())
    {
        vscode.window.showErrorMessage('헤더 주석이 이미 존재합니다.');
        return;
    }

    const headerInfo = await getUserInput(problemNumber);

    const editor = vscode.window.activeTextEditor;
    const config = vscode.workspace.getConfiguration('BOJ');
    const extension = config.get<string>('extension', '');

    if (!editor)
    {
        vscode.window.showErrorMessage('No active text editor found.');
        return;
    }

    const headerComment = generateHeaderComment(headerInfo, extension!);
    editor.edit((editBuilder) =>
    {
        editBuilder.insert(editor.document.positionAt(0), headerComment);
    });

    vscode.window.showInformationMessage('헤더 주석이 생성되었습니다.');
}

async function getUserInput(problemNumber: string): Promise<{ author: string; authorUrl: string; url: string; problemNumber: string }>
{

    const config = vscode.workspace.getConfiguration('BOJ');
    const author = config.get<string>('author', '');

    if (!author)
    {
        throw new Error('author가 설정되지 않았습니다');
    }

    const authorUrl = "boj.kr/u/" + author;

    const url = "https://boj.kr/" + problemNumber;

    return { problemNumber, author, authorUrl, url };
}

function generateHeaderComment(headerInfo: { problemNumber: string; author: string; authorUrl: string; url: string }, extension: string): string
{
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    const asciiArt = [
        "      :::    :::    :::   ",
        "     :+:    :+:      :+:  ",
        "    +:+    +:+        +:+ ",
        "   +#+    +#+          +#+",
        "  +#+      +#+        +#+ ",
        " #+#        #+#      #+#  ",
        "###          ###   ##.kr  "
    ];

    const headerComment: string[] = [];
    let commentStart;
    let commentEnd;
    if (extension === 'c' || extension === 'cpp' || extension === 'cs' || extension === 'java' || extension === 'js' || extension === 'ts' || extension === 'go' || extension === 'rs' || extension === 'swift' || extension === 'kt')
    {
        commentStart = '/*';
        commentEnd = '*/';
    } else if (extension === 'py' || extension === 'rb')
    {
        commentStart = '# ';
        commentEnd = ' #';
    }
    const aoLine = `${commentStart} ${'*'.repeat(74)} ${commentEnd}\n`;
    headerComment.push(aoLine);
    const theLine = `${commentStart} ${' '.repeat(74)} ${commentEnd}\n`;
    headerComment.push(theLine);
    let thirdLine = replaceCharacterAtIndex(theLine, 50, `${asciiArt[0]}`);
    headerComment.push(thirdLine);
    let fourthLine = replaceCharacterAtIndex(theLine, 5, `Problem Number: ${headerInfo.problemNumber}`);
    fourthLine = replaceCharacterAtIndex(fourthLine, 50, `${asciiArt[1]}`);
    headerComment.push(fourthLine);
    let fifthLine = replaceCharacterAtIndex(theLine, 50, `${asciiArt[2]}`);
    headerComment.push(fifthLine);
    let sixthLine = replaceCharacterAtIndex(theLine, 5, `By: ${headerInfo.author} <${headerInfo.authorUrl}>`);
    sixthLine = replaceCharacterAtIndex(sixthLine, 50, `${asciiArt[3]}`);
    headerComment.push(sixthLine);
    let seventhLine = replaceCharacterAtIndex(theLine, 50, `${asciiArt[4]}`);
    headerComment.push(seventhLine);
    let eighthLine = replaceCharacterAtIndex(theLine, 5, `${headerInfo.url}`);
    eighthLine = replaceCharacterAtIndex(eighthLine, 50, `${asciiArt[5]}`);
    headerComment.push(eighthLine);
    let ninthLine = replaceCharacterAtIndex(theLine, 5, `Solved: ${year}/${month}/${day} ${hours}:${minutes}:${seconds} by ${headerInfo.author}`);
    ninthLine = replaceCharacterAtIndex(ninthLine, 50, `${asciiArt[6]}`);
    headerComment.push(ninthLine);
    headerComment.push(theLine);
    headerComment.push(aoLine);

    return headerComment.join('');
}

function replaceCharacterAtIndex(str: string, index: number, newChar: string): string
{
    const chars = str.split(''); // 문자열을 배열로 변환

    if (index >= 0 && index < chars.length && newChar.length > 0)
    {
        for (let i = 0; i < newChar.length; i++)
        {
            chars[index + i] = newChar[i];
        }
    }

    return chars.join(''); // 배열을 다시 문자열로 합치기
}

function hasHeaderComment(): boolean
{
    const editor = vscode.window.activeTextEditor;
    if (!editor)
    {
        vscode.window.showErrorMessage('No active text editor found.');
        return false;
    }

    const firstLine = editor.document.lineAt(0).text;
    return firstLine.startsWith('/* ************************************************************************** */');
}
