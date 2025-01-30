import { isEmpty } from "@/utils/string";
import RntButton from "../common/rntButton";
import RntInput from "../common/rntInput";
import RntPlaceAutoComplete from "../common/rntPlaceAutocomplete";
import { TFunction as TFunctionNext } from "i18next";
import { useEffect, useRef, useState } from "react";
import { ParseLocationResponse } from "@/pages/api/parseLocation";
import moment from "moment";
import { UTC_TIME_ZONE_ID } from "@/utils/date";
import RntButtonTransparent from "@/components/common/rntButtonTransparent";
import * as React from "react";
import arrowUpTurquoise from "../../images/arrows/arrowUpTurquoise.svg";
import arrowDownTurquoise from "../../images/arrows/arrowDownTurquoise.svg";
import Image from "next/image";
import SearchDeliveryLocations from "@/components/search/searchDeliveryLocations";
import { formatLocationInfoUpToCity } from "@/model/LocationInfo";
import { SearchCarFilters, SearchCarRequest } from "@/model/SearchCarRequest";
import { placeDetailsToLocationInfo } from "@/utils/location";
import RntCarMakeSelect from "@/components/common/rntCarMakeSelect";
import RntCarModelSelect from "@/components/common/rntCarModelSelect";
import { SortOptionKey } from "@/hooks/guest/useSearchCars";
import icLocation from "../../images/ic_location.png";
import icSearch from "@/images/ic_search.svg";
import icCalendar from "../../images/ic_calendar.png";
import PanelFilteringByYear from "@/components/search/panelFilteringByYear";
import PanelFilteringByPrice from "@/components/search/panelFilteringByPrice";
import { nameof } from "@/utils/nameof";
import { FilterLimits } from "@/model/SearchCarsResult";
import ScrollingHorizontally from "@/components/common/ScrollingHorizontally";
import bgInput from "@/images/bg_input.png";
import RntFilterSelect from "../common/RntFilterSelect";

export default function SearchAndFilters({
  initValue,
  sortBy,
  setSortBy,
  onSearchClick,
  onFilterApply,
  filterLimits,
  t,
}: {
  initValue: SearchCarRequest;
  sortBy: string | undefined;
  setSortBy: (value: string | undefined) => void;
  onSearchClick: (searchCarRequest: SearchCarRequest) => Promise<void>;
  onFilterApply: (filters: SearchCarFilters) => Promise<void>;
  filterLimits: FilterLimits;
  t: TFunctionNext;
}) {
  const [timeZoneId, setTimeZoneId] = useState("");
  const [searchCarRequest, setSearchCarRequest] = useState<SearchCarRequest>(initValue);

  const gmtLabel = isEmpty(timeZoneId) ? "" : `(GMT${moment.tz(timeZoneId).format("Z").slice(0, 3)})`;
  const notEmtpyTimeZoneId = !isEmpty(timeZoneId) ? timeZoneId : UTC_TIME_ZONE_ID;
  const isSearchAllowed =
    formatLocationInfoUpToCity(searchCarRequest.searchLocation).length > 0 &&
    moment.tz(searchCarRequest.dateFromInDateTimeStringFormat, notEmtpyTimeZoneId) >= moment.tz(notEmtpyTimeZoneId) &&
    new Date(searchCarRequest.dateToInDateTimeStringFormat) > new Date(searchCarRequest.dateFromInDateTimeStringFormat);

  const t_comp = (element: string) => {
    return t("search_and_filters." + element);
  };

  const sortOption: Record<string, string> = t("search_and_filters.sort_options", {
    returnObjects: true,
  }) as Record<string, string>;

  function isSortOptionKey(key: PropertyKey): key is SortOptionKey {
    return sortOption.hasOwnProperty(key);
  }

  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const name = e.target.name;

    if (name === nameof(searchCarRequest, "searchLocation")) {
      return;
    }

    setSearchCarRequest({
      ...searchCarRequest,
      [name]: value,
    });
  }

  useEffect(() => {
    const getGMTFromLocation = async () => {
      const address = formatLocationInfoUpToCity(searchCarRequest.searchLocation);
      if (isEmpty(address)) {
        setTimeZoneId("");
        return;
      }

      var url = new URL(`/api/parseLocation`, window.location.origin);
      url.searchParams.append("address", address);
      const apiResponse = await fetch(url);

      if (!apiResponse.ok) {
        setTimeZoneId("");
        return;
      }
      const apiJson = (await apiResponse.json()) as ParseLocationResponse;
      if ("error" in apiJson) {
        setTimeZoneId("");
        return;
      }

      setTimeZoneId(apiJson.timeZoneId);
    };

    getGMTFromLocation();
  }, [searchCarRequest.searchLocation]);

  const [openDeliveryLocation, setOpenDeliveryLocation] = useState(false);

  const handleClickOpenDeliveryLocation = () => {
    setOpenDeliveryLocation(!openDeliveryLocation);
    setSearchCarRequest({
      ...searchCarRequest,
      isDeliveryToGuest: !openDeliveryLocation,
    });
  };

  useEffect(() => {
    setSearchCarRequest(initValue);
  }, [initValue]);

  const [selectedModelID, setSelectedModelID] = useState<string>("");
  const [searchCarFilters, setSearchCarFilters] = useState<SearchCarFilters | null>(null);
  const [selectedMakeID, setSelectedMakeID] = useState<string>("");

  useEffect(() => {
    if (searchCarFilters) {
      onFilterApply(searchCarFilters);
    }
  }, [searchCarFilters]);

  function handleSearchClick() {
    onSearchClick(searchCarRequest);
    setNewSearchInputChange(searchInputChange);
    setSearchFormVisible(false);
  }

  function handleResetClick() {
    setSearchCarFilters({});
    setSelectedMakeID("");
    setSelectedModelID("");
    setResetFilters(true);
    setSortBy("");
  }

  const [resetFilters, setResetFilters] = useState(false);

  const [scrollPanelFilter, setScrollPanelFilter] = useState<number | null>(null);
  const onScrollPanelFilter = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    setScrollPanelFilter(scrollLeft);
  };

  const [isSearchFormVisible, setSearchFormVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  // Закрытие при клике вне блока
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isSearchFormVisible) {
        setSearchFormVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchFormVisible]);

  useEffect(() => {
    const body = document.body;
    if (isSearchFormVisible) {
      body.classList.add("overflow-hidden");
    } else {
      body.classList.remove("overflow-hidden");
    }
  }, [isSearchFormVisible]);

  const [searchInputChange, setSearchInputChange] = useState("");
  const [newSearchInputChange, setNewSearchInputChange] = useState("");

  const renderSearchBlockContent = () => (
    <>
      <RntPlaceAutoComplete
        isTransparentStyle={true}
        iconFrontLabel={icLocation}
        className="w-full"
        inputClassName="mt-1 z-10"
        labelClassName="pl-3.5 font-bold"
        id={nameof(searchCarRequest, "searchLocation")}
        label={t_comp("location_label")}
        placeholder={t_comp("location_placeholder")}
        includeStreetAddress={true}
        initValue={formatLocationInfoUpToCity(searchCarRequest.searchLocation)}
        onChange={(e) => {
          handleSearchInputChange(e);
          setSearchInputChange(e.target.value);
        }}
        onAddressChange={async (placeDetails) => {
          setSearchCarRequest({
            ...searchCarRequest,
            searchLocation: placeDetailsToLocationInfo(placeDetails),
          });
          if (!placeDetails.isEditing) {
            setSearchInputChange(placeDetails.addressString);
          }
        }}
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between xl:justify-around">
        <RntInput
          isTransparentStyle={true}
          iconFrontLabel={icCalendar}
          className="basis-1/3"
          inputClassName="pr-4 z-10"
          labelClassName="pl-[18px] z-10 font-bold"
          id={nameof(searchCarRequest, "dateFromInDateTimeStringFormat")}
          label={`${t_comp("datetime_from")} ${gmtLabel}`}
          type="datetime-local"
          value={searchCarRequest.dateFromInDateTimeStringFormat}
          onChange={handleSearchInputChange}
        />
        <RntInput
          isTransparentStyle={true}
          iconFrontLabel={icCalendar}
          className="basis-1/3"
          inputClassName="pr-4 z-10"
          labelClassName="pl-[18px] z-10 font-bold"
          id={nameof(searchCarRequest, "dateToInDateTimeStringFormat")}
          label={`${t_comp("datetime_to")} ${gmtLabel}`}
          type="datetime-local"
          value={searchCarRequest.dateToInDateTimeStringFormat}
          onChange={handleSearchInputChange}
        />
        <RntButton
          className="mt-2 flex w-full items-center justify-center md:w-48"
          disabled={!isSearchAllowed}
          onClick={handleSearchClick}
        >
          <Image src={icSearch} alt="" className="mr-2 h-[16px]" />
          {t_comp("button_search")}
        </RntButton>
      </div>
    </>
  );

  return (
    <>
      <div
        className="relative flex h-[50px] w-full cursor-text flex-col pl-5 pt-1 text-sm sm:hidden"
        onClick={() => setSearchFormVisible(true)}
      >
        <div className="z-10 flex flex-col">
          <span className="whitespace-nowrap font-semibold">
            {newSearchInputChange || formatLocationInfoUpToCity(searchCarRequest.searchLocation)}
          </span>
          <span>
            {formatDate(searchCarRequest.dateFromInDateTimeStringFormat)} -{" "}
            {formatDate(searchCarRequest.dateToInDateTimeStringFormat)}
          </span>
        </div>

        <Image src={bgInput} alt="" className="absolute left-0 top-0 h-full w-full rounded-full" />
      </div>

      {/* блок поиска, который открывается на малых экранах */}
      <div
        className={`fixed inset-0 top-[57px] z-50 flex bg-black/50 sm:hidden ${isSearchFormVisible ? "block" : "hidden"}`}
      >
        <div
          ref={modalRef}
          className="relative flex h-fit w-full max-w-md flex-col gap-4 bg-rentality-bg-left-sidebar p-4"
        >
          <button
            type="button"
            title=""
            className="absolute right-2 top-2 text-gray-500 hover:text-black"
            onClick={() => setSearchFormVisible(false)}
          >
            ✖
          </button>
          {renderSearchBlockContent()}
        </div>
      </div>

      {/* блок поиска для экранов больше sm */}
      <div className="search mb-2 mt-1 hidden flex-col gap-4 sm:flex xl:flex-row xl:items-end">
        {renderSearchBlockContent()}
      </div>

      <ScrollingHorizontally onScroll={onScrollPanelFilter} className="mt-4">
        <div className="min-w-48">
          <RntCarMakeSelect
            id={t_comp("select_filter_make")}
            isTransparentStyle={true}
            className="min-w-[17ch] justify-center bg-transparent pl-0 text-lg text-rentality-secondary"
            promptText={t_comp("select_filter_make")}
            value={searchCarFilters?.brand ?? ""}
            onMakeSelect={(newID, newMake) => {
              setSelectedMakeID(newID);
              setSearchCarFilters({
                ...searchCarFilters,
                brand: newMake,
              });
            }}
          />
        </div>

        <div className="">
          <RntCarModelSelect
            id={t_comp("select_filter_model")}
            isTransparentStyle={true}
            className="min-w-[15ch] justify-center bg-transparent pl-0 text-lg text-rentality-secondary"
            promptText={t_comp("select_filter_model")}
            value={searchCarFilters?.model ?? ""}
            make_id={selectedMakeID}
            onModelSelect={(newID, newModel) => {
              setSelectedModelID(newID);
              setSearchCarFilters({
                ...searchCarFilters,
                model: newModel,
              });
            }}
          />
        </div>

        <PanelFilteringByYear
          id={"panel-filtering-year"}
          scrollInfo={scrollPanelFilter}
          onClickReset={() => {
            setSearchCarFilters({
              ...searchCarFilters,
              yearOfProductionFrom: 0,
              yearOfProductionTo: 0,
            });
          }}
          onClickApply={(selectedValues) => {
            setSearchCarFilters({
              ...searchCarFilters,
              yearOfProductionFrom: selectedValues[0],
              yearOfProductionTo: selectedValues[1],
            });
            setResetFilters(false);
          }}
          isResetFilters={resetFilters}
          minValue={filterLimits.minCarYear}
        />

        <PanelFilteringByPrice
          id={"panel-filtering-price"}
          scrollInfo={scrollPanelFilter}
          onClickReset={() => {
            setSearchCarFilters({
              ...searchCarFilters,
              pricePerDayInUsdFrom: 0,
              pricePerDayInUsdTo: 0,
            });
          }}
          onClickApply={(selectedValues) => {
            setSearchCarFilters({
              ...searchCarFilters,
              pricePerDayInUsdFrom: selectedValues[0],
              pricePerDayInUsdTo: selectedValues[1],
            });
            setResetFilters(false);
          }}
          isResetFilters={resetFilters}
          maxValue={filterLimits.maxCarPrice}
        />

        <div className="flex justify-between gap-4 max-sm:w-full">
          <RntButton className="w-40" onClick={handleResetClick}>
            {t_comp("button_reset_filters")}
          </RntButton>
          <RntFilterSelect
            className="bg-rnt-button-gradient w-52 justify-center border-0 text-lg text-white"
            //selectClassName="   custom-select px-4  cursor-pointer"
            id="sort"
            placeholder={t_comp("sort_by")}
            value={sortBy ? sortOption[sortBy] : ""}
            onChange={(e) => {
              const newDataKey = Object.entries(sortOption ?? {})[e.target.selectedIndex]?.[0];
              if (isSortOptionKey(newDataKey)) {
                setSortBy(newDataKey);
              }
            }}
          >
            {Object.entries(sortOption ?? {}).map(([key, value]) => (
              <RntFilterSelect.Option key={key} value={value} />
            ))}
          </RntFilterSelect>
        </div>

        <RntButtonTransparent className="w-48" onClick={handleClickOpenDeliveryLocation}>
          <div className="relative flex w-48 items-center justify-center text-rentality-secondary">
            <div className="text-lg">{t_comp("button_deliver_to_me")}</div>
            <Image
              src={openDeliveryLocation ? arrowUpTurquoise : arrowDownTurquoise}
              alt=""
              className="max-sm:absolute max-sm:right-4 sm:ml-3"
            />
          </div>
        </RntButtonTransparent>
      </ScrollingHorizontally>
      {openDeliveryLocation && (
        <div>
          <SearchDeliveryLocations searchCarRequest={searchCarRequest} setSearchCarRequest={setSearchCarRequest} />
        </div>
      )}
    </>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return formatter.format(date); //.replace(",", "");
}
