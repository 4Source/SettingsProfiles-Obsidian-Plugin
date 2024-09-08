import SettingsProfilesPlugin from "src/main";
import { DialogModal } from "./DialogModal";
import { ProfileSettings } from "src/settings/SettingsInterface";
import { Notice } from "obsidian";

export class ProfileOverrideDialogModal extends DialogModal {
	constructor(plugin: SettingsProfilesPlugin, profile: ProfileSettings, handler?: { onSubmit?: () => void, onDeny?: () => void, onSaved?: () => void }) {
		super(plugin.app, 'Save current settings to profile?', 'You are about to overwrite the current settings of this profile. This cannot be undone.', {
			onSubmit: () => {
				if (handler && handler.onSubmit) {
					handler.onSubmit();
				}
				plugin.saveProfileSettings(profile)
					.then(() => {
						new Notice('Saved profile successfully');
						if (handler && handler.onSaved) {
							handler.onSaved();
						}
					});
			},
			onDeny: () => {
				new Notice('Cancelled override profile');
				if (handler && handler.onDeny) {
					handler.onDeny();
				}
			},
			onDontShowAgain: () => {
				plugin.setHideProfileOverrideDialog(true);
				plugin.saveSettings();
			},
		}, { submit: "Override", submitWarning: true, deny: "Cancel", denyWarning: false, dontShowAgain: plugin.getHideProfileOverrideDialog() })
	}
}