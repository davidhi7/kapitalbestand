import { computed, defineModel, ref, watch, withDefaults } from 'vue';
import AutoCompleteEntry from './AutoCompleteEntry.vue';
import TextInput from './TextInput.vue';
import { __VLS_Prettify, __VLS_WithDefaults, __VLS_TypePropsToRuntimeProps } from './AutoComplete.vue';

export default (<T extends { id: any; name: string; }>(
__VLS_props: Awaited<typeof __VLS_setup>['props'],
__VLS_ctx?: __VLS_Prettify<Pick<Awaited<typeof __VLS_setup>, 'attrs' | 'emit' | 'slots'>>,
__VLS_expose?: NonNullable<Awaited<typeof __VLS_setup>>['expose'],
__VLS_setup = (async () => {
const { defineProps, defineSlots, defineEmits, defineExpose, defineOptions, } = await import('vue');
const model = defineModel<T>();
const props = withDefaults(
defineProps<{
suggestions: T[];
type?: 'date' | 'month' | 'text';
placeholder?: string;
required?: boolean;
}>(),
{
suggestions: () => [],
type: 'text',
placeholder: '',
required: false
}
);

const emit = defineEmits<{
(e: 'requestCreate', name: string): void;
}>();

let textInput = ref('');
watch(model, (newValue: T) => {
textInput.value = newValue.name;
});

const computedSuggestions = computed<T[]>(() => {
return props.suggestions.filter((suggestion) => suggestion.name.includes(textInput.value));
});
const exactSuggestionExists = computed<boolean>(() => {
return computedSuggestions.value.filter((suggestion) => suggestion.name === textInput.value).length > 0;
});

function pick(suggestion: T) {
model.value = suggestion;
(document.activeElement! as HTMLElement).blur();
}

const root = ref<HTMLElement>();
const focused = ref(false);

function focusIn(evt: FocusEvent) {
focused.value = true;
}

function focusOut(evt: FocusEvent) {
if (root.value?.contains(evt.relatedTarget as Node)) {
return;
}
focused.value = false;

if (!model.value) {
textInput.value = "";
} else {
textInput.value = model.value.name;
}
}
const __VLS_withDefaultsArg = (function <T>(t: T) { return t; })({
suggestions: () => [],
type: 'text',
placeholder: '',
required: false
});

const __VLS_componentsOption = {};

let __VLS_name!: 'AutoComplete';
function __VLS_template() {
let __VLS_ctx!: InstanceType<__VLS_PickNotAny<typeof __VLS_internalComponent, new () => {}>> & {};
/* Components */
let __VLS_otherComponents!: NonNullable<typeof __VLS_internalComponent extends { components: infer C; } ? C : {}> & typeof __VLS_componentsOption;
let __VLS_own!: __VLS_SelfComponent<typeof __VLS_name, typeof __VLS_internalComponent & (new () => { $slots: typeof __VLS_slots; })>;
let __VLS_localComponents!: typeof __VLS_otherComponents & Omit<typeof __VLS_own, keyof typeof __VLS_otherComponents>;
let __VLS_components!: typeof __VLS_localComponents & __VLS_GlobalComponents & typeof __VLS_ctx;
/* Style Scoped */
type __VLS_StyleScopedClasses = {};
let __VLS_styleScopedClasses!: __VLS_StyleScopedClasses | keyof __VLS_StyleScopedClasses | (keyof __VLS_StyleScopedClasses)[];
/* CSS variable injection */
/* CSS variable injection end */
let __VLS_resolvedLocalAndGlobalComponents!: {} &
__VLS_WithComponent<'TextInput', typeof __VLS_localComponents, "TextInput", "TextInput", "TextInput"> &
__VLS_WithComponent<'AutoCompleteEntry', typeof __VLS_localComponents, "AutoCompleteEntry", "AutoCompleteEntry", "AutoCompleteEntry">;
__VLS_intrinsicElements.div; __VLS_intrinsicElements.div; __VLS_intrinsicElements.div; __VLS_intrinsicElements.div;
__VLS_components.TextInput;
// @ts-ignore
[TextInput,];
__VLS_components.AutoCompleteEntry; __VLS_components.AutoCompleteEntry; __VLS_components.AutoCompleteEntry; __VLS_components.AutoCompleteEntry;
// @ts-ignore
[AutoCompleteEntry, AutoCompleteEntry, AutoCompleteEntry, AutoCompleteEntry,];
__VLS_intrinsicElements.b; __VLS_intrinsicElements.b;
{
const __VLS_0 = __VLS_intrinsicElements["div"];
const __VLS_1 = __VLS_elementAsFunctionalComponent(__VLS_0);
const __VLS_2 = __VLS_1({ ...{ onFocusin: {} as any, onFocusout: {} as any, }, class: ("group relative focus-within:bg-input-bg rounded-t-lg"), ref: ("root"), }, ...__VLS_functionalComponentArgsRest(__VLS_1));
({} as (props: __VLS_FunctionalComponentProps<typeof __VLS_0, typeof __VLS_2> & Record<string, unknown>) => void)({ ...{ onFocusin: {} as any, onFocusout: {} as any, }, class: ("group relative focus-within:bg-input-bg rounded-t-lg"), ref: ("root"), });
const __VLS_3 = __VLS_pickFunctionalComponentCtx(__VLS_0, __VLS_2)!;
let __VLS_4!: __VLS_NormalizeEmits<typeof __VLS_3.emit>;
({ 'rounded-b-lg': !__VLS_ctx.textInput && __VLS_ctx.computedSuggestions.length == 0 });
// @ts-ignore
(__VLS_ctx.root);
let __VLS_5 = { 'focusin': __VLS_pickEvent(__VLS_4['focusin'], ({} as __VLS_FunctionalComponentProps<typeof __VLS_1, typeof __VLS_2>).onFocusin) };
__VLS_5 = {
focusin: $event => {
__VLS_ctx.focusIn($event);
// @ts-ignore
[textInput, computedSuggestions, root, focusIn,];
}
};
let __VLS_6 = { 'focusout': __VLS_pickEvent(__VLS_4['focusout'], ({} as __VLS_FunctionalComponentProps<typeof __VLS_1, typeof __VLS_2>).onFocusout) };
__VLS_6 = {
focusout: $event => {
__VLS_ctx.focusOut($event);
// @ts-ignore
[focusOut,];
}
};
{
const __VLS_7 = ({} as 'TextInput' extends keyof typeof __VLS_ctx ? { 'TextInput': typeof __VLS_ctx.TextInput; } : typeof __VLS_resolvedLocalAndGlobalComponents).TextInput;
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({ ...{}, class: ("group-focus-within:bg-input-bg group-focus-within:shadow-none"), type: ((__VLS_ctx.$props.type)), placeholder: ((props.placeholder)), required: ((props.required)), showRequiredIndicator: ((!__VLS_ctx.focused)), modelValue: ((__VLS_ctx.textInput)), }));
({} as { TextInput: typeof __VLS_7; }).TextInput;
const __VLS_9 = __VLS_8({ ...{}, class: ("group-focus-within:bg-input-bg group-focus-within:shadow-none"), type: ((__VLS_ctx.$props.type)), placeholder: ((props.placeholder)), required: ((props.required)), showRequiredIndicator: ((!__VLS_ctx.focused)), modelValue: ((__VLS_ctx.textInput)), }, ...__VLS_functionalComponentArgsRest(__VLS_8));
({} as (props: __VLS_FunctionalComponentProps<typeof __VLS_7, typeof __VLS_9> & Record<string, unknown>) => void)({ ...{}, class: ("group-focus-within:bg-input-bg group-focus-within:shadow-none"), type: ((__VLS_ctx.$props.type)), placeholder: ((props.placeholder)), required: ((props.required)), showRequiredIndicator: ((!__VLS_ctx.focused)), modelValue: ((__VLS_ctx.textInput)), });
const __VLS_10 = __VLS_pickFunctionalComponentCtx(__VLS_7, __VLS_9)!;
let __VLS_11!: __VLS_NormalizeEmits<typeof __VLS_10.emit>;
}
{
const __VLS_12 = __VLS_intrinsicElements["div"];
const __VLS_13 = __VLS_elementAsFunctionalComponent(__VLS_12);
const __VLS_14 = __VLS_13({ ...{}, class: ("absolute rounded-b-lg w-full z-10 hidden group-focus-within:block group-focus-within:bg-input-bg overflow-hidden shadow-md"), }, ...__VLS_functionalComponentArgsRest(__VLS_13));
({} as (props: __VLS_FunctionalComponentProps<typeof __VLS_12, typeof __VLS_14> & Record<string, unknown>) => void)({ ...{}, class: ("absolute rounded-b-lg w-full z-10 hidden group-focus-within:block group-focus-within:bg-input-bg overflow-hidden shadow-md"), });
const __VLS_15 = __VLS_pickFunctionalComponentCtx(__VLS_12, __VLS_14)!;
let __VLS_16!: __VLS_NormalizeEmits<typeof __VLS_15.emit>;
if (__VLS_ctx.textInput && !__VLS_ctx.exactSuggestionExists) {
{
const __VLS_17 = ({} as 'AutoCompleteEntry' extends keyof typeof __VLS_ctx ? { 'AutoCompleteEntry': typeof __VLS_ctx.AutoCompleteEntry; } : typeof __VLS_resolvedLocalAndGlobalComponents).AutoCompleteEntry;
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({ ...{ onClick: {} as any, }, }));
({} as { AutoCompleteEntry: typeof __VLS_17; }).AutoCompleteEntry;
({} as { AutoCompleteEntry: typeof __VLS_17; }).AutoCompleteEntry;
const __VLS_19 = __VLS_18({ ...{ onClick: {} as any, }, }, ...__VLS_functionalComponentArgsRest(__VLS_18));
({} as (props: __VLS_FunctionalComponentProps<typeof __VLS_17, typeof __VLS_19> & Record<string, unknown>) => void)({ ...{ onClick: {} as any, }, });
const __VLS_20 = __VLS_pickFunctionalComponentCtx(__VLS_17, __VLS_19)!;
let __VLS_21!: __VLS_NormalizeEmits<typeof __VLS_20.emit>;
let __VLS_22 = { 'click': __VLS_pickEvent(__VLS_21['click'], ({} as __VLS_FunctionalComponentProps<typeof __VLS_18, typeof __VLS_19>).onClick) };
__VLS_22 = {
click: $event => {
if (!((__VLS_ctx.textInput && !__VLS_ctx.exactSuggestionExists))) return;
__VLS_ctx.emit('requestCreate', __VLS_ctx.textInput);
// @ts-ignore
[$props, focused, textInput, $props, focused, textInput, $props, focused, textInput, textInput, exactSuggestionExists, emit, textInput,];
}
};
{
const __VLS_23 = __VLS_intrinsicElements["b"];
const __VLS_24 = __VLS_elementAsFunctionalComponent(__VLS_23);
const __VLS_25 = __VLS_24({ ...{}, }, ...__VLS_functionalComponentArgsRest(__VLS_24));
({} as (props: __VLS_FunctionalComponentProps<typeof __VLS_23, typeof __VLS_25> & Record<string, unknown>) => void)({ ...{}, });
const __VLS_26 = __VLS_pickFunctionalComponentCtx(__VLS_23, __VLS_25)!;
let __VLS_27!: __VLS_NormalizeEmits<typeof __VLS_26.emit>;
(__VLS_ctx.textInput);
(__VLS_26.slots!).default;
}
(__VLS_20.slots!).default;
}
// @ts-ignore
[textInput,];
}
for (const [suggestion] of __VLS_getVForSourceType((__VLS_ctx.computedSuggestions)!)) {
{
const __VLS_28 = ({} as 'AutoCompleteEntry' extends keyof typeof __VLS_ctx ? { 'AutoCompleteEntry': typeof __VLS_ctx.AutoCompleteEntry; } : typeof __VLS_resolvedLocalAndGlobalComponents).AutoCompleteEntry;
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({ ...{ onClick: {} as any, }, }));
({} as { AutoCompleteEntry: typeof __VLS_28; }).AutoCompleteEntry;
({} as { AutoCompleteEntry: typeof __VLS_28; }).AutoCompleteEntry;
const __VLS_30 = __VLS_29({ ...{ onClick: {} as any, }, }, ...__VLS_functionalComponentArgsRest(__VLS_29));
({} as (props: __VLS_FunctionalComponentProps<typeof __VLS_28, typeof __VLS_30> & Record<string, unknown>) => void)({ ...{ onClick: {} as any, }, });
const __VLS_31 = __VLS_pickFunctionalComponentCtx(__VLS_28, __VLS_30)!;
let __VLS_32!: __VLS_NormalizeEmits<typeof __VLS_31.emit>;
let __VLS_33 = { 'click': __VLS_pickEvent(__VLS_32['click'], ({} as __VLS_FunctionalComponentProps<typeof __VLS_29, typeof __VLS_30>).onClick) };
__VLS_33 = {
click: $event => {
__VLS_ctx.pick(suggestion);
// @ts-ignore
[computedSuggestions, pick,];
}
};
(suggestion.name);
(__VLS_31.slots!).default;
}
}
(__VLS_15.slots!).default;
}
(__VLS_3.slots!).default;
}
if (typeof __VLS_styleScopedClasses === 'object' && !Array.isArray(__VLS_styleScopedClasses)) {
}
var __VLS_slots!: {};
return __VLS_slots;
}
const __VLS_internalComponent = (await import('vue')).defineComponent({
setup() {
return {
AutoCompleteEntry: AutoCompleteEntry as typeof AutoCompleteEntry,
TextInput: TextInput as typeof TextInput,
emit: emit as typeof emit,
textInput: textInput as typeof textInput,
computedSuggestions: computedSuggestions as typeof computedSuggestions,
exactSuggestionExists: exactSuggestionExists as typeof exactSuggestionExists,
pick: pick as typeof pick,
root: root as typeof root,
focused: focused as typeof focused,
focusIn: focusIn as typeof focusIn,
focusOut: focusOut as typeof focusOut,
};
},
props: {} as __VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<typeof __VLS_fnPropsTypeOnly>, typeof __VLS_withDefaultsArg>,
emits: ({} as __VLS_NormalizeEmits<typeof emit>),
});
const __VLS_fnComponent = (await import('vue')).defineComponent({
emits: ({} as __VLS_NormalizeEmits<typeof emit>),
});
const __VLS_defaults = {};
let __VLS_fnPropsTypeOnly!: {} & {
suggestions: T[];
type?: 'date' | 'month' | 'text';
placeholder?: string;
required?: boolean;
} & {
modelValue?: T;
};
let __VLS_fnPropsDefineComponent!: InstanceType<typeof __VLS_fnComponent>['$props'];
let __VLS_fnPropsSlots!: {};
let __VLS_defaultProps!: import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
return {} as {
props: __VLS_Prettify<__VLS_OmitKeepDiscriminatedUnion<typeof __VLS_fnPropsDefineComponent & typeof __VLS_fnPropsTypeOnly, keyof typeof __VLS_defaultProps>> & typeof __VLS_fnPropsSlots & typeof __VLS_defaultProps;
expose(exposed: import('vue').ShallowUnwrapRef<{}>): void;
attrs: any;
slots: ReturnType<typeof __VLS_template>;
emit: typeof emit;
};
})()
) => ({} as import('vue').VNode & { __ctx?: Awaited<typeof __VLS_setup>; }));
