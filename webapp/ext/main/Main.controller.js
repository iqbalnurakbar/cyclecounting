sap.ui.define(
  [
    "sap/fe/core/PageController",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (PageController, MessageToast, MessageBox, Filter, FilterOperator) {
    "use strict";

    // --- Utility Functions ---

    function getRequestId() {
      const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
      return urlParams.get("request_id");
    }

    function getTodayISO() {
      return new Date().toISOString().slice(0, 10);
    }

    function setInputValues(view, values) {
      Object.keys(values).forEach((id) => {
        if (view.byId(id)) {
          view.byId(id).setValue(values[id]);
        }
      });
    }

    function clearInputFields(view, fieldIds) {
      fieldIds.forEach((id) => {
        if (view.byId(id).getEditable() == true) {
          view.byId(id).setValue("");
        }
      });
    }

    function setActionParameters(oAction, params) {
      Object.keys(params).forEach((key) => {
        oAction.setParameter(key, params[key]);
      });
    }

    // --- Global Data ---
    let globalData = {
      request_id: "",
      plant: "",
      base_unit_of_measure: "",
      cycle_wise: "",
      material: "",
    };

    // --- Field IDs for clearing ---
    const ALL_INPUT_FIELD_IDS = [
      "idBatchInput",
      "idCOGIInput",
      "idCountedUnitInput",
      "idDeadlineDatePicker",
      "idDescription2Input",
      "idDescriptionInput",
      "idDifferenceQtyInput",
      "idDifferenceValueInput",
      "idFulfilmentDatePicker",
      "idGroupIDInput",
      "idLastModifyInput",
      "idLocationComboBox",
      "idMaterialInput",
      "idOrderTypeInput",
      "idPartTypeInput",
      "idProblemVhComboBox",
      "idRemarkInput",
      "idRequestorInput",
      "idRequestDatePicker",
      "idSAPDifferenceInput",
      "idSAPQtyInput",
      "idSiteInput",
      "idSpecialStockNumberInput",
      "idToleranceInput",
      "idTotalCountedInput",
      "idStockCategoryInput",
      "idStateInput",
      "idScheduleInput",
      "idSpecialStockIndicatorInput",
    ];

    function updateTotalCounter(oView) {
      const oModel = oView.getModel();
      const linkContext = `/im_counting('${globalData.request_id}')/com.sap.gateway.srvd.zr_wm317_counting.v0001.sap_qty_side_effect(...)`;
      const oAction = oModel.bindContext(linkContext, null);

      const params = {
        special_stock_indicator: oView
          .byId("idSpecialStockIndicatorInput")
          .getValue(),
        stock_category: oView.byId("idStockCategoryInput").getValue(),
        batch_managed: oView.byId("idBatchInput").getEditable(),
        material: oView.byId("idMaterialInput").getValue(),
        batch: oView.byId("idBatchInput").getValue(),
        plant: globalData.plant,
        storage_location: oView.byId("idLocationComboBox").getSelectedKey(),
        special_stock_number: oView
          .byId("idSpecialStockNumberInput")
          .getValue(),
      };

      setActionParameters(oAction, params);

      oAction
        .execute()
        .then(() => {
          const oResult = oAction.getBoundContext().getObject();
          setInputValues(oView, {
            idSAPQtyInput: oResult.sap_quantity,
            idDifferenceValueInput: oResult.difference_value,
            idDifferenceQtyInput: oResult.difference,
            idTotalCountedInput: oResult.total_counted,
            idSAPDifferenceInput: oResult.sap_difference,
          });

          // If cogi_qty is needed, show the input field
          if (oResult.cogi_qty_needed === true) {
            oView.byId("idCOGIFormElement").setVisible(true);
          } else {
            oView.byId("idCOGIFormElement").setVisible(false);
          }
        })
        .catch((err) => {
          console.error("Action failed:", err);
        });
    }

    function getMaterialDescription(oView) {
      const oModel = oView.getModel();
      const linkContext = `/im_counting('${globalData.request_id}')/com.sap.gateway.srvd.zr_wm317_counting.v0001.get_material_desc(...)`;
      const oAction = oModel.bindContext(linkContext, null);
      setActionParameters(oAction, {
        material: oView.byId("idMaterialInput").getValue(),
        material_desc: "",
        plant: "",
        part_type: "",
      });
      oAction
        .execute()
        .then(() => {
          const oResult = oAction.getBoundContext().getObject();
          oView.byId("idDescriptionInput").setValue(oResult.material_desc);
          oView.byId("idPartTypeInput").setValue(oResult.part_type);
        })
        .catch((err) => {
          console.error("Action failed:", err);
        });
    }

    function checkBatch(oView) {
      const oModel = oView.getModel();
      const linkContext = `/im_counting('${globalData.request_id}')/com.sap.gateway.srvd.zr_wm317_counting.v0001.check_batch(...)`;
      const oAction = oModel.bindContext(linkContext, null);
      setActionParameters(oAction, {
        material: oView.byId("idMaterialInput").getValue(),
        material_desc: "",
        plant: globalData.plant,
        part_type: "",
      });
      oAction
        .execute()
        .then(() => {
          const oResult = oAction.getBoundContext().getObject();
          oView.byId("idBatchInput").setEditable(oResult.batch_needed);
        })
        .catch((err) => {
          console.error("Action failed:", err);
        });
    }

    // function preloadData(oView) {
    //   const oModel = oView.getModel();
    //   const linkContext = `/im_counting('${globalData.request_id}')/com.sap.gateway.srvd.zr_wm317_counting.v0001.preload_data(...)`;
    //   const oAction = oModel.bindContext(linkContext, null);

    //   oAction
    //     .execute()
    //     .then(() => {
    //       const oResult = oAction.getBoundContext().getObject();

    //       console.log("preload_old: ", oResult);
    //       globalData.plant = oResult.plant;
    //       globalData.base_unit_of_measure = oResult.base_unit_of_measure;
    //       globalData.cycle_wise = oResult.cycle_wise;
    //       globalData.material = oResult.material;
    //       // Material input logic
    //       if (oResult.request_type == "A" || oResult.cycle_wise == "L") {
    //         oView.byId("idMaterialInput").setValue("");
    //         oView.byId("idMaterialInput").setEditable(true);
    //       } else {
    //         oView.byId("idMaterialInput").setValue(oResult.material);
    //         oView.byId("idMaterialInput").setEditable(false);
    //       }

    //       oView.byId("idBatchInput").setEditable(oResult.batch_needed);

    //       setInputValues(oView, {
    //         idRequestorInput: oResult.requestor,
    //         idDescriptionInput: oResult.material_desc,
    //         idLastModifyInput: oResult.last_modify,
    //         idScheduleInput: oResult.zschedule,
    //         idOrderTypeInput: oResult.item_size,
    //         idSiteInput: oResult.site,
    //         idToleranceInput: oResult.tolerance,
    //         idFulfilmentDatePicker: oResult.fulfilment_date,
    //         idRemarkInput: oResult.remark,
    //         idProblemVhComboBox: oResult.problem,
    //         idCOGIInput: oResult.cogi,
    //         idStateInput: oResult.state,
    //         idLocationInput: oResult.location,
    //         idGroupIDInput: oResult.group_id,
    //         idSAPQtyInput: oResult.sap_quantity,
    //         idDifferenceValueInput: oResult.difference_value,
    //         idDifferenceQtyInput: oResult.difference,
    //         idTotalCountedInput: oResult.total_counted,
    //         idSAPDifferenceInput: oResult.sap_difference,
    //         idRequestDatePicker: oResult.request_date,
    //         idMaterialInput: oResult.material,
    //         idBatchInput: oResult.batch,
    //         idPartTypeInput: oResult.part_type,
    //       });

    //       oView
    //         .byId("idStockCategoryInput")
    //         .setEditable(!oResult.stock_category_needed);

    //       updateTotalCounter(oView);
    //       filterProblemByPlant(oView, globalData.plant);
    //     })
    //     .catch((err) => {
    //       console.error("Action failed:", err);
    //     });
    // }

    function filterProblemByPlant(oView, sPlant) {
      var oComboBox = oView.byId("idProblemVhComboBox");
      var oBinding = oComboBox.getBinding("items");

      if (oBinding) {
        var aFilters = [];
        if (sPlant) {
          aFilters.push(new Filter("Werks", FilterOperator.EQ, sPlant));
        }
        oBinding.filter(aFilters);
      }
    }

    // --- Main Controller ---
    return PageController.extend("cyclecounting.ext.main.Main", {
      onButtonJumpToCountingPress: async function (oEvent) {
        if (globalData.cycle_wise === "L") {
          MessageBox.error("Cycle Wise L is not allowed to Overplus");
          return;
        }

        MessageToast.show("Jumping to Counting Overplus...");

        try {
          var Navigation =
            await sap.ushell.Container.getServiceAsync("Navigation");
          var oParams = {
            request_id: globalData.request_id,
          };
          const oTarget = {
            target: {
              semanticObject: "zcyclecountingimoverplus",
              action: "display",
            },
            params: oParams,
          };
          const oComponent = this.getOwnerComponent();
          Navigation.navigate(oTarget, oComponent);
        } catch (error) {
          console.error(
            "Error during the navigation to Overplus Form: ",
            error,
          );
        }
      },

      onButtonSaveWithoutSubmitPress: function () {
        const counted_unit_input = this.getView()
          .byId("idCountedUnitInput")
          .getValue();
        if (
          !counted_unit_input ||
          counted_unit_input.trim() === "" ||
          counted_unit_input === "0"
        ) {
          MessageBox.error("Counted Unit is mandatory!");
          return;
        }

        const oModel = this.getView().getModel();
        const linkContext = `/im_counting('${globalData.request_id}')/com.sap.gateway.srvd.zr_wm317_counting.v0001.save_without_submit(...)`;
        const oAction = oModel.bindContext(linkContext, null);

        // Gather parameters
        const params = {
          request_id: globalData.request_id,
          counted_unit: this.getView().byId("idCountedUnitInput").getValue(),
          material: this.getView().byId("idMaterialInput").getValue() || "",
          material_desc:
            this.getView().byId("idDescriptionInput").getValue() || "",
          batch: this.getView().byId("idBatchInput").getValue() || "",
          stock_category:
            this.getView().byId("idStockCategoryInput").getValue() || "",
          special_stock_ind:
            this.getView().byId("idSpecialStockIndicatorInput").getValue() ||
            "",
          special_stock_num:
            this.getView().byId("idSpecialStockNumberInput").getValue() || "",
          sap_difference:
            this.getView().byId("idSAPDifferenceInput").getValue() || "0",
          group_id: this.getView().byId("idGroupIDInput").getValue() || "",
          total_counted:
            this.getView().byId("idTotalCountedInput").getValue() || "0",
          state: this.getView().byId("idStateInput").getValue() || "",
          zschedule: this.getView().byId("idScheduleInput").getValue() || "",
          difference:
            this.getView().byId("idDifferenceQtyInput").getValue() || "0",
          request_date: getTodayISO(),
          requestor: this.getView().byId("idRequestorInput").getValue() || "",
          last_modify:
            this.getView().byId("idLastModifyInput").getValue() || "",
          location:
            this.getView().byId("idLocationComboBox").getSelectedKey() || "",
          problem:
            this.getView().byId("idProblemVhComboBox").getSelectedKey() || "",
          remark: this.getView().byId("idRemarkInput").getValue() || "",
          cogi: this.getView().byId("idCOGIInput").getValue() || "0",
          order_type: this.getView().byId("idOrderTypeInput").getValue() || "",
          site: this.getView().byId("idSiteInput").getValue() || "",
          sap_quantity: this.getView().byId("idSAPQtyInput").getValue() || "0",
          difference_value:
            this.getView().byId("idDifferenceValueInput").getValue() || "0",
          part_type: this.getView().byId("idPartTypeInput").getValue() || "",
          fulfilment_date: getTodayISO(),
          deadline: getTodayISO(),
          base_unit_of_measure: globalData.base_unit_of_measure,
          cogi_qty_needed: this.getView()
            .byId("idCOGIFormElement")
            .getVisible(),
        };

        setActionParameters(oAction, params);

        oAction
          .execute()
          .then(() => {
            const oResult = oAction.getBoundContext().getObject();
            if (oResult.error === true) {
              MessageBox.error(oResult.error_reason);
            } else {
              MessageToast.show("Save without Submitting...");

              // Erase every editable field into empty
              ALL_INPUT_FIELD_IDS.forEach((id) => {
                if (this.getView().byId(id).getEditable() == true) {
                  this.getView().byId(id).setValue("");
                }
              });
              updateTotalCounter(this.getView());
            }
          })
          .catch((err) => {
            console.error("Action failed:", err);
          });
      },

      onButtonSaveAndSubmitPress: function (oEvent) {
        const counted_unit_input = this.getView()
          .byId("idCountedUnitInput")
          .getValue();
        if (
          !counted_unit_input ||
          counted_unit_input.trim() === "" ||
          counted_unit_input === "0"
        ) {
          MessageBox.error("Counted Unit is mandatory!");
          return;
        }

        const oModel = this.getView().getModel();
        const linkContext = `/im_counting('${globalData.request_id}')/com.sap.gateway.srvd.zr_wm317_counting.v0001.save_and_submit(...)`;
        const oAction = oModel.bindContext(linkContext, null);

        // Gather parameters
        const params = {
          request_id: globalData.request_id,
          counted_unit: this.getView().byId("idCountedUnitInput").getValue(),
          material: this.getView().byId("idMaterialInput").getValue() || "",
          material_desc:
            this.getView().byId("idDescriptionInput").getValue() || "",
          batch: this.getView().byId("idBatchInput").getValue() || "",
          stock_category:
            this.getView().byId("idStockCategoryInput").getValue() || "",
          special_stock_ind:
            this.getView().byId("idSpecialStockIndicatorInput").getValue() ||
            "",
          special_stock_num:
            this.getView().byId("idSpecialStockNumberInput").getValue() || "",
          sap_difference:
            this.getView().byId("idSAPDifferenceInput").getValue() || "0",
          group_id: this.getView().byId("idGroupIDInput").getValue() || "",
          total_counted:
            this.getView().byId("idTotalCountedInput").getValue() || "0",
          state: this.getView().byId("idStateInput").getValue() || "",
          zschedule: this.getView().byId("idScheduleInput").getValue() || "",
          difference:
            this.getView().byId("idDifferenceQtyInput").getValue() || "0",
          request_date: getTodayISO(),
          requestor: this.getView().byId("idRequestorInput").getValue() || "",
          last_modify:
            this.getView().byId("idLastModifyInput").getValue() || "",
          location:
            this.getView().byId("idLocationComboBox").getSelectedKey() || "",
          problem:
            this.getView().byId("idProblemVhComboBox").getSelectedKey() || "",
          remark: this.getView().byId("idRemarkInput").getValue() || "",
          cogi: this.getView().byId("idCOGIInput").getValue() || "0",
          order_type: this.getView().byId("idOrderTypeInput").getValue() || "",
          site: this.getView().byId("idSiteInput").getValue() || "",
          sap_quantity: this.getView().byId("idSAPQtyInput").getValue() || "0",
          difference_value:
            this.getView().byId("idDifferenceValueInput").getValue() || "0",
          part_type: this.getView().byId("idPartTypeInput").getValue() || "",
          fulfilment_date: getTodayISO(),
          deadline: getTodayISO(),
          base_unit_of_measure: globalData.base_unit_of_measure,
          cogi_qty_needed: this.getView()
            .byId("idCOGIFormElement")
            .getVisible(),
        };

        setActionParameters(oAction, params);

        oAction
          .execute()
          .then(async () => {
            const oResult = oAction.getBoundContext().getObject();
            if (oResult.error === true) {
              MessageBox.error(oResult.error_reason);
            } else {
              MessageToast.show("Save and Submitting...");

              // Disable all fields except countedUnit
              ALL_INPUT_FIELD_IDS.forEach((id) => {
                if (this.getView().byId(id).getEditable() == true) {
                  this.getView().byId(id).setEditable(false);
                }
              });

              var Navigation =
                await sap.ushell.Container.getServiceAsync("Navigation");
              Navigation.backToPreviousApp();
            }
          })
          .catch((err) => {
            console.error("Action failed:", err);
          });
      },

      onButtonClearDataPress: function (oEvent) {
        clearInputFields(this.getView(), ALL_INPUT_FIELD_IDS);
        MessageToast.show("Clearing data...");
      },

      onInit: function () {
        PageController.prototype.onInit.apply(this, arguments);
        this._attachInputEventDelegates();
      },

      onAfterRendering: function () {
        globalData.request_id = getRequestId();
        this._preloadDataCounting(globalData.request_id);
        this._filterLocByRequestId(globalData.request_id);
        // preloadData(this.getView());
      },

      onInputForSAPQtyChange: function (oEvent) {
        updateTotalCounter(this.getView());
      },

      onInputMaterialChange: function (oEvent) {
        updateTotalCounter(this.getView());
        getMaterialDescription(this.getView());
        checkBatch(this.getView());
      },

      onButtonViewMaterialPress: async function (oEvent) {
        MessageToast.show("Viewing Material...");
        try {
          var Navigation =
            await sap.ushell.Container.getServiceAsync("Navigation");
          var oParams = {
            Matnr: globalData.material,
          };
          const oTarget = {
            target: {
              semanticObject: "zwm305loadpic",
              action: "display",
            },
            params: oParams,
          };
          const oComponent = this.getOwnerComponent();
          Navigation.navigate(oTarget, oComponent);
        } catch (error) {
          console.error(
            "Error during the navigation to Load Picture Apps: ",
            error,
          );
        }
      },

      onButtonSumPress: async function (oEvent) {
        MessageToast.show("Navigating to Difference Summary Dashboard...");
        try {
          var Navigation =
            await sap.ushell.Container.getServiceAsync("Navigation");
          var oParams = {
            request_id: globalData.request_id,
          };
          const oTarget = {
            target: {
              semanticObject: "zwm104diffsumdashboard",
              action: "display",
            },
            params: oParams,
          };
          const oComponent = this.getOwnerComponent();
          Navigation.navigate(oTarget, oComponent);
        } catch (error) {
          console.error(
            "Error during the navigation to Difference Summary Dashboard: ",
            error,
          );
        }
      },

      _preloadDataCounting: function (sRequestId) {
        if (!sRequestId) return;

        const oView = this.getView();
        const oModel = oView.getModel();
        const aFilters = [
          new Filter("request_id", FilterOperator.EQ, sRequestId.trim()),
        ];

        oModel
          .bindList("/im_counting", undefined, undefined, aFilters)
          .requestContexts(0, 1)
          .then((aContexts) => {
            const oResult = aContexts[0].getObject();

            // Update global state
            globalData.plant = oResult.plant;
            globalData.base_unit_of_measure = oResult.base_unit_of_measure;
            globalData.cycle_wise = oResult.cycle_wise;
            globalData.material = oResult.material;

            // Material input logic
            if (oResult.request_type == "A" || oResult.cycle_wise == "L") {
              oView.byId("idMaterialInput").setValue("");
              oView.byId("idMaterialInput").setEditable(true);
            } else {
              oView.byId("idMaterialInput").setValue(oResult.material);
              oView.byId("idMaterialInput").setEditable(false);
            }

            oView.byId("idBatchInput").setEditable(oResult.batch_needed);
            oView
              .byId("idStockCategoryInput")
              .setEditable(!oResult.stock_category_needed);

            setInputValues(oView, {
              idRequestorInput: oResult.requestor,
              idDescriptionInput: oResult.material_desc,
              idLastModifyInput: oResult.last_modify,
              idScheduleInput: oResult.zschedule,
              idOrderTypeInput: oResult.order_type,
              idSiteInput: oResult.site,
              idToleranceInput: oResult.tolerance,
              idFulfilmentDatePicker: oResult.fulfilment_date,
              idRemarkInput: oResult.remark,
              idProblemVhComboBox: oResult.problem,
              idCOGIInput: oResult.cogi,
              idStateInput: oResult.state,
              idLocationComboBox: oResult.location,
              idGroupIDInput: oResult.group_id,
              idSAPQtyInput: oResult.sap_quantity,
              idDifferenceValueInput: oResult.difference_value,
              idDifferenceQtyInput: oResult.difference,
              idTotalCountedInput: oResult.total_counted,
              idSAPDifferenceInput: oResult.sap_difference,
              idRequestDatePicker: oResult.request_date,
              idMaterialInput: oResult.material,
              idBatchInput: oResult.batch,
              idPartTypeInput: oResult.part_type,
            });

            updateTotalCounter(oView);
            filterProblemByPlant(oView, globalData.plant);
          })
          .catch((oErr) => console.error("Load Counting failed:", oErr));
      },

      _filterLocByRequestId: function (sRequestId) {
        if (!sRequestId) return;

        const oView = this.getView();
        const oComboBox = oView.byId("idLocationComboBox");

        const oBinding = oComboBox.getBinding("items");

        if (oBinding) {
          var aFilters = [];
          aFilters.push(
            new Filter("requestid", FilterOperator.EQ, sRequestId.trim()),
          );

          oBinding.filter(aFilters);
        }
      },

      onLocationChange: function (oEvent) {
        const oSelectedItem = oEvent.getParameter("selectedItem");

        if (!oSelectedItem) return;

        const oContext = oSelectedItem.getBindingContext();
        const oData = oContext.getObject();

        this._navigateToRequestId(oData.requestid);
      },

      _navigateToRequestId: async function (sRequestId) {
        if (!sRequestId) return;

        try {
          const Navigation =
            await sap.ushell.Container.getServiceAsync("Navigation");

          Navigation.navigate({
            target: {
              semanticObject: "zcyclecountingim", // ← semantic object
              action: "display",
            },
            params: {
              request_id: sRequestId,
            },
          });
        } catch (oErr) {
          console.error("Navigation failed:", oErr);
        }
      },

      _attachInputEventDelegates: function () {
        const oMainPage = this.byId("idMainPage");
        if (oMainPage) {
          oMainPage.addEventDelegate({
            onkeydown: (oEvent) => {
              if (oEvent.key === "Enter") {
                this.onButtonSaveWithoutSubmitPress();
              }
            },
          });
        }
      },
    });
  },
);
