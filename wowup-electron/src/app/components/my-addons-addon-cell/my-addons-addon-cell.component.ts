import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from "@angular/core";
import { AddonDependencyType } from "../../models/wowup/addon-dependency-type";
import { AddonViewModel } from "../../business-objects/addon-view-model";
import * as AddonUtils from "../../utils/addon.utils";
import { capitalizeString } from "../../utils/string.utils";
import { AddonChannelType } from "app/models/wowup/addon-channel-type";
import { Addon, AddonFundingLink } from "app/entities/addon";
import { AddonService } from "app/services/addons/addon.service";
import { getAddonDependencies, hasMultipleProviders, needsUpdate } from "../../utils/addon.utils";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { AddonInstallState } from "app/models/wowup/addon-install-state";

@Component({
  selector: "app-my-addons-addon-cell",
  templateUrl: "./my-addons-addon-cell.component.html",
  styleUrls: ["./my-addons-addon-cell.component.scss"],
})
export class MyAddonsAddonCellComponent implements OnInit, OnDestroy {
  @Input("addon") listItem: Addon;
  @Input() showUpdateToVersion = false;

  @Output() onViewDetails: EventEmitter<AddonViewModel> = new EventEmitter();

  private _subscriptions: Subscription[] = [];

  public readonly capitalizeString = capitalizeString;

  public addonUtils = AddonUtils;
  public hasThumbnail: boolean;
  public isBetaChannel: boolean;
  public isAlphaChannel: boolean;
  public isIgnored: boolean;
  public thumbnailUrl?: string;
  public thumbnailLetter: string;
  public addonName: string;
  public hasFundingLinks: boolean;
  public fundingLinks: AddonFundingLink[];
  public hasIgnoreReason: boolean;
  public ignoreTooltipKey: string;
  public hasMultipleProviders: boolean;
  public autoUpdateEnabled: boolean;
  public requiredDependencyCount: number;
  public hasRequiredDependencies: boolean;
  public isLoadOnDemand: boolean;
  public ignoreIcon: string;
  public installedVersion: string;
  public needsUpdate: boolean;
  public latestVersion: string;

  public isInstalling: boolean = false;

  constructor(private _addonService: AddonService) {}

  ngOnInit(): void {
    this.initData();

    const addonInstalledSub = this._addonService.addonInstalled$
      .pipe(filter((evt) => this._addonService.isSameAddon(evt.addon, this.listItem)))
      .subscribe((evt) => {
        this.isInstalling = evt.installState === AddonInstallState.Installing;
      });

    this._subscriptions.push(addonInstalledSub);
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private initData() {
    if (!this.listItem) {
      return;
    }

    this.addonName = this.listItem.name;
    this.thumbnailUrl = this.listItem.thumbnailUrl;
    this.hasThumbnail = !!this.thumbnailUrl;
    this.isBetaChannel = this.listItem.channelType === AddonChannelType.Beta;
    this.isAlphaChannel = this.listItem.channelType === AddonChannelType.Alpha;
    this.isIgnored = this.listItem.isIgnored;
    this.thumbnailLetter = this.listItem.name.charAt(0).toUpperCase();
    this.fundingLinks = this.listItem.fundingLinks ?? [];
    this.hasFundingLinks = this.fundingLinks.length > 0;
    this.hasIgnoreReason = !!this.listItem?.ignoreReason;
    this.ignoreTooltipKey = this.getIgnoreTooltipKey();
    this.hasMultipleProviders = hasMultipleProviders(this.listItem);
    this.autoUpdateEnabled = this.listItem.autoUpdateEnabled;
    this.requiredDependencyCount = this.getRequireDependencyCount();
    this.hasRequiredDependencies = this.requiredDependencyCount > 0;
    this.isLoadOnDemand = this.listItem.isLoadOnDemand;
    this.ignoreIcon = this.getIgnoreIcon();
    this.installedVersion = this.listItem.installedVersion;
    this.needsUpdate = !this.isInstalling && needsUpdate(this.listItem);
    this.latestVersion = this.listItem.latestVersion;
  }

  viewDetails() {
    // this.onViewDetails.emit(this.listItem);
  }

  getRequireDependencyCount() {
    return getAddonDependencies(this.listItem, AddonDependencyType.Required).length;
  }

  private getIgnoreTooltipKey() {
    switch (this.listItem.ignoreReason) {
      case "git_repo":
        return "PAGES.MY_ADDONS.ADDON_IS_CODE_REPOSITORY";
      case "missing_dependency":
      case "unknown":
      default:
        return "";
    }
  }

  private getIgnoreIcon() {
    switch (this.listItem.ignoreReason) {
      case "git_repo":
        return "fas:code";
      case "missing_dependency":
      case "unknown":
      default:
        return "";
    }
  }

  get dependencyTooltip() {
    return {
      dependencyCount: this.getRequireDependencyCount(),
    };
  }
}
