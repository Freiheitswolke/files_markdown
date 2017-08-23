// based on https://github.com/mcecot/markdown-it-checkbox

import * as MarkdownIt from "markdown-it";
import {Token} from "markdown-it";

export interface CheckboxPluginOptions {
    divWrap: boolean;
    divClass: string;
    idPrefix: string;
    readonly: boolean;
    checkboxClass: string;
}

interface TokenConstructor {
    new (name: string, tagName: string, someNumber: number): Token;
}

export function CheckBoxReplacer(md: MarkdownIt.MarkdownIt, userOptions: Partial<CheckboxPluginOptions>): MarkdownIt.Rule {
    let lastId = 0;
    const defaults: CheckboxPluginOptions = {
        divWrap: false,
        divClass: 'checkbox',
        idPrefix: 'checkbox',
        readonly: true,
        checkboxClass: ''
    };
    const options: CheckboxPluginOptions = $.extend(defaults, userOptions);
    const pattern = /\[(X|\s|\_|\-)\]\s(.*)/i;
    const createTokens = function (checked: boolean, label: string, Token: TokenConstructor): Token[] {
        const nodes: Token[] = [];
        let token: Token;

        /**
         * <div class="checkbox">
         */
        if (options.divWrap) {
            token = new Token("checkbox_open", "div", 1);
            token.attrs = [["class", options.divClass]];
            nodes.push(token);
        }

        /**
         * <input type="checkbox" id="checkbox{n}" checked="true">
         */
        const id = options.idPrefix + lastId;
        lastId += 1;
        token = new Token("checkbox_input", "input", 0);
        token.attrs = [["type", "checkbox"], ["id", id]];
        if (checked === true) {
            token.attrs.push(["checked", "true"]);
        }
        if (options.readonly) {
            token.attrs.push(["disabled", "disabled"]);
        }
        if (options.checkboxClass) {
            token.attrs.push(["class", options.checkboxClass]);
        }
        nodes.push(token);

        /**
         * <label for="checkbox{n}">
         */
        token = new Token("label_open", "label", 1);
        token.attrs = [["for", id]];
        nodes.push(token);

        /**
         * content of label tag
         */
        token = new Token("text", "", 0);
        token.content = label;
        nodes.push(token);

        /**
         * closing tags
         */
        nodes.push(new Token("label_close", "label", -1));
        if (options.divWrap) {
            nodes.push(new Token("checkbox_close", "div", -1));
        }
        return nodes;
    };

    const splitTextToken = function (original: Token, Token: TokenConstructor): Token[] {
        const text = original.content;
        const matches = text.match(pattern);
        if (matches === null) {
            return [original];
        }
        const value = matches[1];
        const label = matches[2];
        const checked = (value === "X" || value === "x");
        return createTokens(checked, label, Token);
    };

    return function (state) {
        const blockTokens: Token[] = state.tokens;
        for (const token of blockTokens) {
            if (token.type === "inline") {
                token.children = ([] as Token[]).concat.apply(this,
                    token.children.map(childToken => splitTextToken(childToken, state.Token))
                );
            }
        }
    };
}

export function CheckboxPlugin(md: MarkdownIt.MarkdownIt, options: CheckboxPluginOptions) {
    md.core.ruler.push("checkbox", CheckBoxReplacer(md, options));
}