import { Extension } from '@tiptap/core';
import type { CommandProps } from '@tiptap/core';

// Divulga ao TypeScript os comandos custom das extensões Indent/LineHeight
// (evita precisar de "as any" toda vez que são chamados via editor.chain()).
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        indent: {
            increaseIndent: () => ReturnType;
            decreaseIndent: () => ReturnType;
        };
        // Chave própria (não "lineHeight") para não colidir com o grupo de
        // comandos já declarado por @tiptap/extension-text-style.
        customLineHeight: {
            setLineHeight: (lineHeight: string) => ReturnType;
            unsetLineHeight: () => ReturnType;
            setMarginTop: (marginTop: string) => ReturnType;
            unsetMarginTop: () => ReturnType;
            setMarginBottom: (marginBottom: string) => ReturnType;
            unsetMarginBottom: () => ReturnType;
        };
    }
}

// Flag global usada para evitar que o dropdown de espaçamento feche antes
// do clique de confirmação ser processado (ver menus de line-height no ArticleForm).
declare global {
    interface Window {
        isLineHeightConfirmed?: boolean;
    }
}

// Extensão customizada para suporte a font-size inline
export const FontSize = Extension.create({
    name: 'fontSize',
    addGlobalAttributes() {
        return [
            {
                types: ['textStyle'],
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize || null,
                        renderHTML: attributes => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}` };
                        },
                    },
                },
            },
        ];
    },
});

// Extensão de Tab = recuo de parágrafo (como o Word)
export const TabIndent = Extension.create({
    name: 'tabIndent',
    addKeyboardShortcuts() {
        return {
            // Tab insere um recuo visual fixo (salvo no banco, exibido ao usuário)
            Tab: () =>
                this.editor.commands.insertContent(
                    '<span style="display:inline-block;width:2em"> </span>'
                ),
        };
    },
});

// Extensão de Indentação (aumentar/diminuir recuo via margin-left)
export const Indent = Extension.create({
    name: 'indent',
    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading'],
                attributes: {
                    indent: {
                        default: 0,
                        parseHTML: element => {
                            const ml = element.style.marginLeft;
                            if (!ml) return 0;
                            return parseInt(ml) / 40 || 0;
                        },
                        renderHTML: attributes => {
                            if (!attributes.indent || attributes.indent === 0) return {};
                            return { style: `margin-left: ${attributes.indent * 40}px` };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            increaseIndent: () => ({ tr, state, dispatch }: CommandProps) => {
                const { from, to } = state.selection;
                let changed = false;
                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                        const indent = (node.attrs.indent || 0) + 1;
                        if (dispatch) {
                            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
                            changed = true;
                        }
                    }
                });
                return changed;
            },
            decreaseIndent: () => ({ tr, state, dispatch }: CommandProps) => {
                const { from, to } = state.selection;
                let changed = false;
                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                        const indent = Math.max(0, (node.attrs.indent || 0) - 1);
                        if (dispatch) {
                            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
                            changed = true;
                        }
                    }
                });
                return changed;
            },
        };
    },
});

export const LineHeight = Extension.create({
    name: 'lineHeight',
    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading'],
                attributes: {
                    lineHeight: {
                        default: null,
                        parseHTML: element => element.style.lineHeight || null,
                        renderHTML: attributes => {
                            if (!attributes.lineHeight) return {};
                            return { style: `line-height: ${attributes.lineHeight} !important` };
                        },
                    },
                    marginTop: {
                        default: null,
                        parseHTML: element => element.style.marginTop || null,
                        renderHTML: attributes => {
                            if (!attributes.marginTop) return {};
                            return { style: `margin-top: ${attributes.marginTop} !important` };
                        },
                    },
                    marginBottom: {
                        default: null,
                        parseHTML: element => element.style.marginBottom || null,
                        renderHTML: attributes => {
                            if (!attributes.marginBottom) return {};
                            return { style: `margin-bottom: ${attributes.marginBottom} !important` };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setLineHeight: (lineHeight: string) => ({ tr, state, dispatch }: CommandProps) => {
                const { from, to } = state.selection;
                let changed = false;
                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                        if (node.attrs.lineHeight !== lineHeight) {
                            if (dispatch) {
                                tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight });
                            }
                            changed = true;
                        }
                    }
                });
                return changed;
            },
            unsetLineHeight: () => ({ tr, state, dispatch }: CommandProps) => {
                const { from, to } = state.selection;
                let changed = false;
                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                        if (node.attrs.lineHeight) {
                            if (dispatch) {
                                const attrs = { ...node.attrs };
                                delete attrs.lineHeight;
                                tr.setNodeMarkup(pos, undefined, attrs);
                            }
                            changed = true;
                        }
                    }
                });
                return changed;
            },
            setMarginTop: (marginTop: string) => ({ tr, state, dispatch }: CommandProps) => {
                const { from, to } = state.selection;
                let changed = false;
                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                        if (node.attrs.marginTop !== marginTop) {
                            if (dispatch) {
                                tr.setNodeMarkup(pos, undefined, { ...node.attrs, marginTop });
                            }
                            changed = true;
                        }
                    }
                });
                return changed;
            },
            unsetMarginTop: () => ({ tr, state, dispatch }: CommandProps) => {
                const { from, to } = state.selection;
                let changed = false;
                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                        if (node.attrs.marginTop) {
                            if (dispatch) {
                                const attrs = { ...node.attrs };
                                delete attrs.marginTop;
                                tr.setNodeMarkup(pos, undefined, attrs);
                            }
                            changed = true;
                        }
                    }
                });
                return changed;
            },
            setMarginBottom: (marginBottom: string) => ({ tr, state, dispatch }: CommandProps) => {
                const { from, to } = state.selection;
                let changed = false;
                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                        if (node.attrs.marginBottom !== marginBottom) {
                            if (dispatch) {
                                tr.setNodeMarkup(pos, undefined, { ...node.attrs, marginBottom });
                            }
                            changed = true;
                        }
                    }
                });
                return changed;
            },
            unsetMarginBottom: () => ({ tr, state, dispatch }: CommandProps) => {
                const { from, to } = state.selection;
                let changed = false;
                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                        if (node.attrs.marginBottom) {
                            if (dispatch) {
                                const attrs = { ...node.attrs };
                                delete attrs.marginBottom;
                                tr.setNodeMarkup(pos, undefined, attrs);
                            }
                            changed = true;
                        }
                    }
                });
                return changed;
            },
        };
    },
});
