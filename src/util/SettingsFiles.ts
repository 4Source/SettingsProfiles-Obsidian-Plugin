import { existsSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, normalize, sep } from "path";
import { PROFILE_OPTIONS_MAP, ProfileOptions } from "src/settings/SettingsInterface";
import { ensurePathExist, getAllFiles, isValidPath } from "./FileSystem";

/**
 * Saves the profile options data to the path.
 * @param profile The profile to save
 * @param profilesPath The path where the profile should be saved 
 */
export async function saveProfileOptions(profile: ProfileOptions, profilesPath: string) {
    try {
        // Ensure is valid profile
        if (!profile) {
            throw Error(`Can't save undefined profile! Profile: ${JSON.stringify(profile)}`);
        }
        // Ensure is valid path
        if (!isValidPath([profilesPath, profile.name])) {
            throw Error(`Invalid path received! ProfilesPath: ${profilesPath}`)
        }
        // Ensure path exist
        ensurePathExist([profilesPath, profile.name]);

        // Write profile settings to path
        const file = join(profilesPath, profile.name, "profile.json");
        const profileSettings = JSON.stringify(profile, null, 2);
        writeFileSync(file, profileSettings, 'utf-8');
    } catch (e) {
        (e as Error).message = 'Failed to save profile data! ' + (e as Error).message;
        throw e;
    }
}

/**
 * Saves the profiles options data to the path.
 * @param profilesList The profiles to save
 * @param profilesPath The path where the profiles should be saved 
 */
export async function saveProfilesOptions(profilesList: ProfileOptions[], profilesPath: string) {
    try {
        profilesList.forEach(profile => {
            // Ensure is valid profile
            if (!profile) {
                throw Error(`Can't save undefined profile! Profile: ${JSON.stringify(profile)}`);
            }
            // Ensure is valid path
            if (!isValidPath([profilesPath, profile.name])) {
                throw Error(`Invalid path received! ProfilesPath: ${profilesPath}`)
            }
            // Ensure path exist
            ensurePathExist([profilesPath, profile.name]);

            // Write profile settings to path
            const file = join(profilesPath, profile.name, "profile.json");
            const profileSettings = JSON.stringify(profile, null, 2);
            writeFileSync(file, profileSettings, 'utf-8');
        });
    } catch (e) {
        (e as Error).message = 'Failed to save profiles data! ' + (e as Error).message + ` ProfilesList: ${JSON.stringify(profilesList)}`;
        throw e;
    }
}

/**
 * Loads the profile options data form the path
 * @param profile The profile to load name is requierd
 * @param profilesPath The path where the profiles are saved
 * @param
 */
export function loadProfileOptions(profile: Partial<ProfileOptions>, profilesPath: string): ProfileOptions {
    try {
        if (!profile.name) {
            throw Error(`Name is requierd! Profile: ${JSON.stringify(profile)}`);
        }
        // Search for all profiles existing
        const file = join(profilesPath, profile.name, 'profile.json');
        let profileData: ProfileOptions | undefined = undefined;

        if (!existsSync(file)) {
            throw Error(`Path does not exist! Path: ${file}`);
        }

        if (!statSync(file).isFile()) {
            throw Error(`The path does not point to a file. Path: ${file}`);
        }

        // Read profile settings
        const data = readFileSync(file, "utf-8");
        profileData = JSON.parse(data);

        if (!profileData) {
            throw Error(`Failed to read profile from file!`);
        }

        // Convert date string to date
        profileData.modifiedAt = new Date(profileData.modifiedAt);

        return profileData;
    } catch (e) {
        (e as Error).message = 'Failed to load profile data! ' + (e as Error).message;
        throw e;
    }
}

/**
 * Loads the profiles options data form the path
 * @param profilesPath The path where the profiles are saved
 */
export function loadProfilesOptions(profilesPath: string): ProfileOptions[] {
    try {
        // Search for all profiles existing
        const files = getAllFiles([profilesPath, `${sep}*${sep}profile.json`]);
        let profilesList: ProfileOptions[] = [];

        // Read profile settings
        files.forEach(file => {
            if (!existsSync(file)) {
                throw Error(`Path does not exist! Path: ${file}`);
            }

            if (!statSync(file).isFile()) {
                throw Error(`The path does not point to a file. Path: ${file}`);
            }
            const data = readFileSync(file, "utf-8");
            let profileData = JSON.parse(data);

            if (!profileData) {
                throw Error(`Failed to read profile from file!`);
            }

            // Convert date string to date
            profileData.modifiedAt = new Date(profileData.modifiedAt);

            profilesList.push(profileData);
        });
        return profilesList;
    } catch (e) {
        (e as Error).message = 'Failed to load profiles data! ' + (e as Error).message;
        throw e;
    }
}

/**
 * Returns all setting files if they are enabeled in profile
 * @param profile The profile for which the files will be returned
 * @returns an array of file names
 * @todo return {add: string[], remove: string[]}
 */
export function getConfigFilesList(profile: ProfileOptions): string[] {
    const files = [];
    for (const key in profile) {
        if (profile.hasOwnProperty(key)) {
            const value = profile[key as keyof ProfileOptions];
            if (typeof value === 'boolean' && key !== 'enabled' && value) {
                const file = PROFILE_OPTIONS_MAP[key as keyof ProfileOptions]?.file;
                if (file && typeof file === 'string') {
                    files.push(normalize(file));
                }
                else if (file && Array.isArray(file)) {
                    file.forEach(f => {
                        files.push(normalize(f));
                    })
                }
            }
        }
    }

    return files;
}

/**
 * Returns all files without placeholder
 * @param filesList filesList Files list with placeholders
 * @param path Path to fill placeholders
 * @returns The files list without placeholder
 */
export function getFilesWithoutPlaceholder(filesList: string[], path: string[]): string[] {
    const files: string[] = [];
    filesList.forEach(file => {
        if ((file.includes(`${sep}*${sep}`) || file.includes(`${sep}*`))) {
            const pathVariants = getAllFiles([...path, file])
                // Trim the start of path
                .map(value => value.split(sep).slice(-file.split(sep).length))

            pathVariants.forEach(value => {
                files.push(join(...value))
            })
        }
        else {
            files.push(file);
        }
    });

    return files;
}

/**
 * Returns all ignore files if they are enabeled in profile
 * @param profile The profile for which the files will be returned
 * @returns an array of file names
 * @todo return {add: string[], remove: string[]}
 */
export function getIgnoreFilesList(profile: ProfileOptions): string[] {
    const files = [];
    for (const key in profile) {
        if (profile.hasOwnProperty(key)) {
            const value = profile[key as keyof ProfileOptions];
            if (value && typeof value === 'boolean') {
                const file = PROFILE_OPTIONS_MAP[key as keyof ProfileOptions]?.ignore;
                if (file && typeof file === 'string') {
                    files.push(normalize(file));
                }
                else if (file && Array.isArray(file)) {
                    file.forEach(f => {
                        files.push(normalize(f));
                    })
                }
            }
        }
    }

    return files;
}

/**
 * Filter the file list to only include not ignore files
 * @param filesList Files list to compare
 * @param profile The profile for which the ignore files 
 * @returns The filtered files list
 */
export function filterIgnoreFilesList(filesList: string[], profile: ProfileOptions): string[] {
    const ignoreFiles = getIgnoreFilesList(profile);
    return filesList.filter((file) => !ignoreFiles.contains((file)));
}

/**
 * Filter the file list to only include changed files
 * @param filesList Files list to compare
 * @param sourcePath The path to the source file 
 * @param targetPath The path to the target file
 * @returns The filtered files list
 */
export function filterUnchangedFiles(filesList: string[], sourcePath: string[], targetPath: string[]): string[] {
    return filesList.filter((file) => {
        const sourceFile = join(...sourcePath, file);
        const targetFile = join(...targetPath, file);

        // Check source exist and is file
        if (!existsSync(sourceFile) || !statSync(sourceFile).isFile()) {
            return false;
        }
        // Check target don't exist  
        if (!existsSync(targetFile)) {
            return true;
        }
        // Check target is file
        if (!statSync(targetFile).isFile()) {
            return false;
        }

        const sourceData = readFileSync(sourceFile, "utf-8");
        const targetData = readFileSync(targetFile, "utf-8");

        return sourceData !== targetData;
    })
}