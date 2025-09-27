function SettingsPageHelper(Ext)
{
    this.Ext = Ext;
}

SettingsPageHelper.prototype.initialize = async function()
{
    var result = await browser.storage.local.get('nadekoPort');
    var checkedValue = await browser.storage.local.get('showPopup');
    this.nadekoPort = result.nadekoPort || 12345;
    this.showPopup = checkedValue.showPopup == 'true' ? true : false;
}

SettingsPageHelper.prototype.configChange = function ()
{
    
}