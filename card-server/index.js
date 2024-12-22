import { fileURLToPath } from 'node:url'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { exit } from 'node:process'
import { satoriVue } from 'x-satori/vue'
import express from 'express'
import bodyParser from 'body-parser'
import markdownIt from 'markdown-it'
// markdownit-mdc
import markdownItMDC from 'markdown-it-mdc'
const md = markdownIt({
    html: true,
    linkify: true,
    typographer: true,
}).use(markdownItMDC)
const _DIRNAME = typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url))
const opt = {
    height: 360,
    width: 420,
    fonts: [
        {
            name: 'Inter',
            data: await readFile(resolve(_DIRNAME, './fonts/Inter-Medium.woff')),
            weight: 400,
            style: 'normal',
        },
        {
            name: 'Inter',
            data: await readFile(resolve(_DIRNAME, './fonts/Inter-Bold.woff')),
            weight: 700,
            style: 'normal',
        },
        {
            name: 'Noto Sans Symbols',
            data: await readFile(resolve(_DIRNAME, './fonts/NotoSansSymbols2-Regular.ttf')),
            weight: 700,
            style: 'normal',
        },
        {
            name: 'NotoSerifSC',
            data: await readFile(resolve(_DIRNAME, './fonts/NotoSerifSC-SemiBold.ttf')),
            weight: 700,
            style: 'normal',
        },
        {
            name: 'NotoSansSC',
            data: await readFile(resolve(_DIRNAME, './fonts/NotoSansSC-Bold.otf')),
            weight: 700,
            style: 'normal',
        },
    ],
    embedFont: false,
}
const gradients = [
    'background-image: linear-gradient( 135deg, #FDEB71 10%, #F8D800 100%);',
    'background-image: linear-gradient( 135deg, #ABDCFF 10%, #0396FF 100%);',
    'background-image: linear-gradient( 135deg, #FEB692 10%, #EA5455 100%);',
    'background-image: linear-gradient( 135deg, #CE9FFC 10%, #7367F0 100%);',
    'background-image: linear-gradient( 135deg, #90F7EC 10%, #32CCBC 100%);',
    'background-image: linear-gradient( 135deg, #FFF6B7 10%, #F6416C 100%);',
    'background-image: linear-gradient( 135deg, #81FBB8 10%, #28C76F 100%);',
    'background-image: linear-gradient( 135deg, #E2B0FF 10%, #9F44D3 100%);'
];
const typeWrap = {
    "image-card": ['<div class="flex flex-col w-full h-full items-center justify-center w-[420px] overflow-hidden" style="$random-color"><div class="flex flex-col items-center justify-center bg-white rounded-2xl overflow-hidden m-5 shadow-sm">', '</div></div>'],
}
function getRandomGradient() {
    const index = Math.floor(Math.random() * gradients.length);
    return gradients[index];
}
function ensureTemplateWrapper(html) {
    // 去除字符串首尾的空白字符
    const trimmedHtml = html.trim();

    // 使用正则表达式检查是否以 <template> 开始并以 </template> 结束
    const templateRegex = /^<template\b[^>]*>[\s\S]*<\/template>$/i;

    if (templateRegex.test(trimmedHtml)) {
        // 已经有最外层的 <template> 标签，直接返回原始 HTML
        return trimmedHtml;
    } else {
        // 没有 <template> 标签，进行包裹
        return `<template>${trimmedHtml}</template>`;
    }
}
function replaceTemplateWithDiv(html, type="image-card") {
    // 去除字符串首尾的空白字符
    const trimmedHtml = html.trim();

    // 正则表达式检查是否以 <template> 开始并以 </template> 结束
    const templateRegex = /^<template\b[^>]*>([\s\S]*)<\/template>$/i;

    let content = trimmedHtml;

    // 如果匹配 <template> 标签，提取内部内容
    const match = trimmedHtml.match(templateRegex);
    if (match) {
        content = match[1].trim();
    }

    // 定义要包裹的 <div> 标签及其类
    const wrapperDivStart = typeWrap[type][0].replace('$random-color', getRandomGradient());
    const wrapperDivEnd = typeWrap[type][1];

    // 包裹内容
    const wrappedContent = `${wrapperDivStart}\n${content}\n${wrapperDivEnd}`;

    return wrappedContent;
}
const wrapFlex = (html) => {
    return html.replace(/class="([^"]*)"/g, (match, p1) => {
            const classes = p1.split(/\s+/);
            if (!classes.includes('flex')) {
                classes.push('flex');
            }
            return `class="${classes.join(' ')}"`;
        });
}
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/generate-svg', async (req, res) => {
    try {
        const { code } = req.body;
        const strSVG = await satoriVue(opt, wrapFlex(ensureTemplateWrapper(replaceTemplateWithDiv(code))));
        console.log(code);
        res.status(200).send(strSVG);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
