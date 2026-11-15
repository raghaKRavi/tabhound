import { Icon } from '../../shared/ui/Icon';
import './SettingsPanel.css';

type Props = {
  contentSearchEnabled: boolean;
  onToggleContentSearch: () => void;
  onClose: () => void;
};

/** Popup settings, opened from the gear in the header. */
export function SettingsPanel({ contentSearchEnabled, onToggleContentSearch, onClose }: Props) {
  return (
    <div class="settings" role="dialog" aria-label="Settings">
      <div class="settings-head">
        <span>Settings</span>
        <button class="settings-x" onClick={onClose} aria-label="Close settings" title="Close">
          <Icon name="x" size={14} />
        </button>
      </div>
      <div class="settings-row">
        <div class="settings-text">
          <strong>Search page descriptions &amp; headings</strong>
          <span>
            {contentSearchEnabled
              ? 'On. Also matches each page’s description and main heading. Stays on this device.'
              : 'Also match each page’s description and main heading. Needs access to all sites.'}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          class={`switch${contentSearchEnabled ? ' on' : ''}`}
          aria-checked={contentSearchEnabled}
          aria-label="Search page descriptions and headings"
          onClick={onToggleContentSearch}
        >
          <span class="switch-state">{contentSearchEnabled ? 'On' : 'Off'}</span>
          <span class="switch-track">
            <span class="switch-knob" />
          </span>
        </button>
      </div>
    </div>
  );
}
