import React from 'react';
import {BASIC_NODES, BASIC_TRANSFORMERS, KoenigComposableEditor, KoenigNestedComposer, MINIMAL_NODES, MINIMAL_TRANSFORMERS, RestrictContentPlugin} from '../index.js';
import {COMMAND_PRIORITY_LOW, KEY_ENTER_COMMAND} from 'lexical';
import {mergeRegister} from '@lexical/utils';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext.js';

// TODO: extract shared behaviour into a `KoenigNestedEditorPlugin` component
function ToggleEditorPlugin({autoFocus, focusNext}) {
    const [editor] = useLexicalComposerContext();

    // using state here because this component can get re-rendered after the
    // editor's editable state changes so we need to re-focus on re-render
    const [shouldFocus, setShouldFocus] = React.useState(autoFocus);

    React.useEffect(() => {
        if (shouldFocus) {
            editor.focus(() => {
                editor.getRootElement().focus({preventScroll: true});
            });
        }
    }, [shouldFocus, editor]);

    React.useEffect(() => {
        return mergeRegister(
            // watch for editor becoming editable rather than relying on an `isEditing` prop
            // because the prop will change before the contenteditable becomes editable, meaning
            // we try to focus a non-editable editor which puts focus on the main editor instead
            editor.registerEditableListener((isEditable) => {
                if (!autoFocus) {
                    return;
                }

                if (isEditable) {
                    setShouldFocus(true);
                } else {
                    setShouldFocus(false);
                }
            }),
            editor.registerCommand(
                KEY_ENTER_COMMAND,
                (event) => {
                    // let the parent editor handle the edit mode toggle
                    if (event.metaKey || event.ctrlKey) {
                        event._fromNested = true;
                        editor._parentEditor?.dispatchCommand(KEY_ENTER_COMMAND, event);
                        return true;
                    }

                    // move focus to the next editor if it exists (e.g. from header to content editor)
                    if (focusNext) {
                        event.preventDefault();
                        focusNext.focus(() => {
                            focusNext.getRootElement().focus({preventScroll: true});
                        });
                        return true;
                    }

                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, autoFocus, focusNext]);

    return null;
}

const Placeholder = ({text = 'Type here', className = ''}) => {
    return (
        <div className={`not-kg-prose pointer-events-none absolute top-0 left-0 min-w-full cursor-text ${className}`}>
            {text}
        </div>
    );
};

const KoenigToggleEditor = ({
    initialEditor,
    nodes = 'basic',
    placeholderText,
    textClassName,
    placeholderClassName,
    autoFocus = false,
    focusNext,
    singleParagraph = false
}) => {
    const initialNodes = nodes === 'minimal' ? MINIMAL_NODES : BASIC_NODES;
    const markdownTransformers = nodes === 'minimal' ? MINIMAL_TRANSFORMERS : BASIC_TRANSFORMERS;

    return (
        <KoenigNestedComposer
            initialEditor={initialEditor}
            initialNodes={initialNodes}
        >
            <KoenigComposableEditor
                className={textClassName}
                markdownTransformers={markdownTransformers}
                placeholder={<Placeholder className={placeholderClassName} text={placeholderText} />}
            >
                {singleParagraph && <RestrictContentPlugin paragraphs={1} />}
                <ToggleEditorPlugin autoFocus={autoFocus} focusNext={focusNext} />
            </KoenigComposableEditor>
        </KoenigNestedComposer>
    );
};

export default KoenigToggleEditor;