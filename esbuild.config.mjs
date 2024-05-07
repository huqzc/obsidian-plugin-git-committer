import esbuild from "esbuild";
import esbuildPluginVue3 from "esbuild-plugin-vue3";
import builtinModules from "builtin-modules";
import process from "process";
import fs from "fs";

/**
 * 决定是否以发布模式进行打包.
 * - 运行 `npm run build` 或 `node esbuild.config.mjs release` 时: `true`.
 * - 运行 `npm run dev` 或 `node esbuild.config.mjs` 时: `false`.
 */
const release = (process.argv[2] === "release");

// 将被插入到 JavaScript 输出文件开头的指定字符串.
const jsBanner = `/**
 * This is a bundled file generated by ESbuild.
 * If you want to view the source, please visit the GitHub repo of this plugin.
 * 
 * 这是一个由 ESbuild 生成的打包文件.
 * 如果您想查看源代码, 请访问这个插件的 GitHub 仓库.
 */
`;

//将被插入到 CSS 输出文件开头的指定字符串.
const cssBanner = `/* *************************************************************************

This is a bundled file generated by ESbuild.
It will be available in Obsidian when the plugin is enabled.
If you want to view the source, please visit the GitHub repo of this plugin.

这是一个由 ESbuild 生成的打包文件.
它会在 Obsidian 加载插件的时候一并进行加载.
如果您想查看源代码, 请访问这个插件的 GitHub 仓库.

************************************************************************* */
`;

const esbuildContext = await esbuild.context({
    // 将任何导入的依赖项嵌入到文件本身.
    bundle: true,
    //指定一组需要纳入打包的入口文件.
    entryPoints: ["src/main.ts"],
    //指定需要排除的文件
    external: [
        "obsidian",
        "electron",
        "@codemirror/autocomplete",
        "@codemirror/collab",
        "@codemirror/commands",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/search",
        "@codemirror/state",
        "@codemirror/view",
        "@lezer/common",
        "@lezer/highlight",
        "@lezer/lr",
        ...builtinModules
    ],
    // outfile: "./plugin/main.js",
    outfile: "./main.js",
    // 在输出文件的开头插入指定的字符串.
    banner: {
        js: jsBanner,
        css: cssBanner
    },
    // 指定 JavaScript 输出文件的格式.
    format: "cjs",
    target: "ESNext",
    logLevel: release ? "info" : "debug",
    sourcemap: release ? false : "inline",
    treeShaking: true,
    plugins: [esbuildPluginVue3()],
    loader: {
        ".svg": 'dataurl'
    }
});

if (release) {
    /**
     * When bundling in a release mode, ESbuild will exit automatically after the bundling is completed.
     * Since ESbuild will automatically specify the name of the CSS output file to be the same as the name of the JavaScript output file, you must rename the CSS output file here.
     *
     * 当以发布模式进行打包时, ESbuild 将在打包完成后自动退出.
     * 因为 ESbuild 会自动将 CSS 输出文件名指定为与 JavaScript 输出文件名相同, 所以您必须在此处重命名 CSS 输出文件.
     */
    await esbuildContext.rebuild();
    fs.rename("./plugin/main.css", "./plugin/styles.css", (err) => {
        if (err) {
            throw err;
        }
    });
    process.exit(0);
} else {
    /**
     * When bundling in a development mode, ESbuild will watch the code for hot updates.
     * Since ESbuild will automatically specify the name of the CSS output file to be the same as the name of the JavaScript output file, you must rename the CSS output file here.
     *
     * 当以开发模式进行打包时, ESbuild 将监听代码进行热更新.
     * 因为 ESbuild 会自动将 CSS 输出文件名指定为与 JavaScript 输出文件名相同, 所以您必须在此处重命名 CSS 输出文件.
     */
    await esbuildContext.watch();
    fs.watchFile("./main.css", () => {
        fs.access("./main.css", fs.constants.F_OK, (err) => {
            if (!err) {
                fs.rename("./main.css", "./styles.css", (err) => {
                    if (err) {
                        throw err;
                    }
                });
            }
        });
    });
}

/**
 * See more configs and APIs at https://esbuild.github.io.
 *
 * 从这里查看更多配置和 API: https://esbuild.github.io.
 */
