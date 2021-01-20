import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, first, map, tap } from "rxjs/operators";
import { AppConfig } from "../../../environments/environment";
import { BlockListRepresentation } from "../../models/wowup-api/block-list";
import { LatestVersionResponse } from "../../models/wowup-api/latest-version-response";
import { CachingService } from "../caching/caching-service";

const API_URL = AppConfig.wowUpApiUrl;
const BLOCKLIST_CACHE_KEY = "wowup-blocklist";

@Injectable({
  providedIn: "root",
})
export class WowUpApiService {
  constructor(private _httpClient: HttpClient, private _cacheService: CachingService) {
    this.getBlockList().pipe(
      first(),
      catchError((e) => {
        console.error(`Failed to get block list`, e);
        return of(undefined);
      }),
      map((response) => {
        if (!response) {
          return;
        }
      })
    );
  }

  public getLatestVersion(): Observable<LatestVersionResponse> {
    const url = new URL(`${API_URL}/wowup/latest`);

    return this._httpClient.get<LatestVersionResponse>(url.toString()).pipe(tap((res) => console.log(res)));
  }

  public getBlockList(): Observable<BlockListRepresentation> {
    const cached = this._cacheService.get<BlockListRepresentation>(BLOCKLIST_CACHE_KEY);
    if (cached) {
      return of(cached);
    }

    const url = new URL(`${API_URL}/blocklist`);

    return this._httpClient.get<BlockListRepresentation>(url.toString()).pipe(
      tap((response) => {
        console.log("BlockList", response);
        this._cacheService.set(BLOCKLIST_CACHE_KEY, response);
      })
    );
  }
}
