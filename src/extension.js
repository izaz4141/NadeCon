async function NadekodonExtension()
{
    if (window.browserName == "Chrome")
    {
        this.installationManager = new ExtensionInstallationMgr;
        this.installationManager.onInitialInstall = this.onInitialInstall.bind(this);
    }


    this.tabsManager = new TabsManager();

    this.cmManager = new ContextMenuManager(this.tabsManager);

    this.settingsPageHlpr = new SettingsPageHelper(this);
    await this.settingsPageHlpr.initialize();

    this.diManager = new DownloadsInterceptManager(this.settingsPageHlpr, this.tabsManager);

    // this.videoBtn = new VideoBtn();
}

NadekodonExtension.prototype.initialize = function()
{
    
};



NadekodonExtension.prototype.onGotSettings = function(resp)
{
    this.settings = resp.settings;

    this.cmManager.createMenu(
        this.settings.browser.menu.dllink != "0",
        this.settings.browser.menu.dlall != "0",
        this.settings.browser.menu.dlselected != "0",
        this.settings.browser.menu.dlpage != "0",
        this.settings.browser.menu.dlvideo != "0",
        this.settings.browser.menu.dlYtChannel != "0",
        this.buildVersion && 
            (  parseInt(this.buildVersion.version) > 5 
            || parseInt(this.buildVersion.version) === 5 && parseInt(this.buildVersion.build) >= 7192 
            || parseInt(this.buildVersion.build) === 0)
        );

    this.diManager.enable = this.settings.browser.monitor.enable != "0";
    this.diManager.skipSmaller = Number(this.settings.browser.monitor.skipSmallerThan);
    this.diManager.skipExts = this.settings.browser.monitor.skipExtensions.toLowerCase();
    if (this.settings.browser.monitor.hasOwnProperty("catchExtensions"))
        this.diManager.catchExts = this.settings.browser.monitor.catchExtensions.toLowerCase();
    this.diManager.skipServersEnabled = this.settings.browser.monitor.skipServersEnabled === "1";
    this.diManager.skipHosts = ExtUtils.skipServers2array(this.settings.browser.monitor.skipServers);
    this.diManager.allowBrowserDownload = this.settings.browser.monitor.allowDownload != "0";
    this.diManager.skipIfKeyPressed = this.settings.browser.monitor.skipIfKeyPressed != "0";
};

NadekodonExtension.prototype.onGotKeyState = function(resp)
{
    this.diManager.skipKeyPressed = resp.pressed;
};

NadekodonExtension.prototype.onGotUiStrings = function(resp)
{
    this.uiStrings = resp.strings;
};


