<script lang="ts">
    import AudioRecorder from '$lib/components/AudioRecorder.svelte';
    import type { BasePassage } from '$lib/types/file-manager';
    import { saveBibleRecording } from '$lib/utils/data-handlers/bible';

    export let open = false;
    export let passage: BasePassage | undefined;

    let dialog: HTMLDialogElement | undefined;

    let audioRecorder: AudioRecorder;
    let recordingAvailableToSave = false;

    let language = '';
    let translation = '';
    let abbreviation = '';

    $: open ? dialog?.showModal() : dialog?.close();

    async function save() {
        const filePath = await audioRecorder?.saveRecording();
        if (filePath && passage) {
            await saveBibleRecording(language, translation, abbreviation, passage, filePath);
        }
        await discard();
    }

    async function discard() {
        language = '';
        translation = '';
        abbreviation = '';
        await audioRecorder.reset();
        open = false;
    }
</script>

<dialog bind:this={dialog} class="modal" on:close={() => (open = false)}>
    <div role="none" class="modal-backdrop" on:click={() => (open = false)} />
    <div class="modal-box space-y-2">
        <h3 class="font-bold text-lg">Make a recording</h3>
        <div class="form-control w-full">
            <label for="language" class="label">
                <span class="label-text">What language are you recording?</span>
            </label>
            <input name="language" type="text" class="input input-bordered w-full" bind:value={language} />
        </div>
        <div class="form-control w-full">
            <label for="translation" class="label">
                <span class="label-text">What is the name of the translation?</span>
            </label>
            <input name="translation" type="text" class="input input-bordered w-full" bind:value={translation} />
        </div>
        <div class="form-control w-full">
            <label for="abbreviation" class="label">
                <span class="label-text">What is a 3-letter abbreviation for this translation?</span>
            </label>
            <input name="abbreviation" type="text" class="input input-bordered w-full" bind:value={abbreviation} />
        </div>

        <AudioRecorder bind:this={audioRecorder} bind:canSave={recordingAvailableToSave} />

        <div class="modal-action justify-center pt-4">
            <button class="btn btn-secondary" on:click={discard}>Discard</button>
            <button
                class="btn btn-primary"
                on:click={save}
                disabled={!recordingAvailableToSave || !language || !translation || !abbreviation}>Save</button
            >
        </div>
    </div>
</dialog>
