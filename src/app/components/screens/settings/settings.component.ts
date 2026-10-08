import { Component, inject, signal } from '@angular/core';
import {
  AvatarComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ListGroupDirective,
  ListGroupItemDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  ButtonCloseDirective,
  RowComponent
} from '@coreui/angular';

import { AvatarRecord } from '../../../models/avatars';
import { validateImageFile } from '../../../utils/image-validator';
import { AvatarsService } from '../../../services/avatars.service';

const AVATAR_KEY = 'settings.avatar';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  imports: [
    AvatarComponent,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    ListGroupDirective,
    ListGroupItemDirective,
    ModalBodyComponent,
    ModalComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ButtonCloseDirective,
    RowComponent
  ]
})
export class SettingsComponent {
  // Placeholder until the real session/user data is available
  readonly user = { name: 'Carlos Santiago', profileType: 'Administrador' };
  readonly appInfo = { name: 'Jhony POS Dashboard', version: '1.0.0' };

  readonly avatar = signal<string>(localStorage.getItem(AVATAR_KEY) ?? './assets/images/pp.jpeg');
  readonly avatarError = signal('');
  private readonly avatarsService = inject(AvatarsService);
  readonly avatars = signal<AvatarRecord[]>([]);
  readonly avatarsLoading = signal(false);
  readonly avatarsError = signal('');
  readonly avatarUploadError = signal('');
  readonly uploading = signal(false);
  aboutVisible = false;
  avatarModalVisible = false;

  /**
   * Opens the avatar modal for selecting or uploading a new image.
   * @author Carlos Santiago
   */
  openAvatarModal(): void {
    this.avatarModalVisible = true;
    this.avatarUploadError.set('');
    this.loadAvatars();
  }

  /**
   * Loads the available avatars from the service and updates the 'avatars' signal.
   * @author Carlos Santiago
   */
  loadAvatars(): void {
    this.avatarsLoading.set(true);
    this.avatarsError.set('');
    this.avatarsService.list().subscribe({
      next: page => {
        this.avatars.set(page.content);
        this.avatarsLoading.set(false);
      },
      error: () => {
        this.avatarsError.set('No se pudieron cargar los avatares.');
        this.avatarsLoading.set(false);
      }
    });
  }

  /**
   * Handles the selection of an image file from an input, validates the file, and uploads it to the server.
   * @param event The event from the target (input file).
   */
  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const error = await validateImageFile(file);
    if (error) {
      this.avatarUploadError.set(error);
      return;
    }
    this.avatarUploadError.set('');
    this.uploading.set(true);
    this.avatarsService.upload(file).subscribe({
      next: record => {
        this.uploading.set(false);
        this.selectAvatar(record);
      },
      error: () => {
        this.uploading.set(false);
        this.avatarUploadError.set('No se pudo subir la imagen. Intenta de nuevo.');
      }
    });
  }

  /**
   * Selects an avatar from the list, updates the local state, and saves the URL in local storage.
   * @param option The selected avatar record (AvatarRecord).
   */
  selectAvatar(option: AvatarRecord): void {
    this.avatar.set(option.url);
    this.avatarError.set('');
    localStorage.setItem(AVATAR_KEY, option.url);
    this.avatarModalVisible = false;
  }

  /**
   * Removes the currently selected avatar from local storage and resets the image to a default value.
   * @author Carlos Santiago
   */
  removeAvatar(): void {
    localStorage.removeItem(AVATAR_KEY);
    this.avatar.set('./assets/images/pp.jpeg');
    this.avatarError.set('');
  }
}

