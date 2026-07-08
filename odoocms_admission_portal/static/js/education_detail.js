// delete education from table and from database
function delete_education(param) {
  data = { edu_id: $(param).attr("value") };
  let confirmAction = confirm("Are you sure to delete?");
  if (confirmAction) {
    $.post("/delete/education/", data, function (data, textStatus) {
      data = JSON.parse(data);
      if (data["status"] == "noerror") {
        if (
          $("#prefer_div_already").find("li").length >= 1 ||
          $("#sortable_program_list").find("li").length > 0
        ) {
          $("#sortable_program_list").find("li").remove();
          $("#prefer_div_already").find("li").remove();
          $("#view_offered_program_button").css({ "pointer-events": "" });
          $("#view_offered_program_button").removeAttr("disabled");
        }
        preferences_allowed = data["preferences_allowed"];
        $("#preference_allowed").val(preferences_allowed);
        if ($(".preference_input_no").length != preferences_allowed) {
          $(".preference_input_no").remove();
          if (preferences_allowed > 0) {
            for (var i = 0; i < preferences_allowed; i++) {
              input = `<input class="form-control preference_input_no" type="text" placeholder='Preference No ${i + 1
                }' />`;
              $("#prefer_div").append(input);
            }
          }
        }
      }
      $(param).parents("tr").remove();
      $("#add_education_form").find(`#degree_level option`).each(function (index, element) {
        $(element).removeAttr("disabled");
      });
      $("#education_table_body").find("tr").each(function (index, element) {
        degree_leveladded = $(element).attr("degree_level");
        $("#add_education_form").find(`#degree_level option:contains(${degree_leveladded})`).attr("disabled", "1");
      });
    });
  }
}
// this function is used when we add subject in education
function prepare_subject(param) {
  let selected = $(param).find("option:selected").val();
  if (selected != "") {
    $(param).parents(".subject_main_div").siblings(".subject_main_div").find("select").find(`option[value=${selected}]`).attr("disabled", "1");
  }
  var all_selected_option = [];
  selected_option = $(".subject_main_div").find("select").find("option:selected");
  $(selected_option).each(function (index, element) {
    if ($(element).val() != "") {
      all_selected_option.push(parseInt($(element).val()));
    }
  });
  all_option = $(".subject_main_div").find("select option");
  $(all_option).each(function (index, element) {
    element_value = parseInt($(element).val());
    if (element_value != "") {
      if (all_selected_option.includes(element_value)) {
      } else {
        $(".subject_main_div").find("select").find(`option[value=${element_value}]`).each(function (index, el) {
          $(el).removeAttr("disabled");
        });
      }
    }
  });
  value = $(param).val();
  $(param).parents("subject_main_div").attr("id", value);
}
function check_subject_marks(param) {
  // this function is used to check obtained_marks less then total marks of subject
  const obtained_marks = $(param).parents(".subject_main_div").find("input[name='subj_marks']").val();
  const total_marks = $(param).parents(".subject_main_div").find("input[name='subj_total_marks']").val();
  if (obtained_marks != "" && total_marks != "") {
    if (parseFloat(total_marks) < parseFloat(obtained_marks)) {
      $(param).parents(".subject_main_div").find("input[name='subj_marks']").val("");
    }
  }
}
function result_status_change() {
  $("#roll_number_last").parent("div").hide();
  $("#last_year_slip").parent("div").hide();
  $("#total_marks").siblings("span").html("Total Marks:");
  $("#obtained_marks").siblings("span").html("Obtained Marks:");
  if (
    $("#degree_id option:selected").text().trim() == "Intermediate" ||
    $("#degree_id option:selected").text().trim() == "intermediate"
  ) {
    if ($("#result_status").val() == "waiting") {
      $("#roll_number_last").parent("div").show();
      $("#last_year_slip").parent("div").show();
      $("#roll_number_last").siblings("span").text("Second Year Board Roll No.");
      $("#total_marks").siblings("span").html("First Year Total Marks:");
      $("#obtained_marks").siblings("span").html("First Year Obtained Marks:");
    } else {
      $("#roll_number_last").parent("div").hide();
      $("#last_year_slip").parent("div").hide();
      $("#total_marks").siblings("span").html("Total Marks:");
      $("#obtained_marks").siblings("span").html("Obtained Marks:");
    }
  }
  if (
    $("#degree_id option:selected").text().trim() == "DAE" ||
    $("#degree_id option:selected").text().trim() == "dae"
  ) {
    if ($("#result_status").val() == "waiting") {
      $("#roll_number_last").parent("div").show();
      $("#last_year_slip").parent("div").show();
      $("#roll_number_last").siblings("span").text("DAE Last Year Roll No.");
      $("#total_marks").siblings("span").html("Second Year Total Marks:");
      $("#obtained_marks").siblings("span").html("Second Year Obtained Marks:");
    } else {
      $("#roll_number_last").parent().hide();
      $("#last_year_slip").parent().hide();
      $("#total_marks").siblings("span").html("Total Marks:");
      $("#obtained_marks").siblings("span").html("Obtained Marks:");
    }
  }
}
function update_education(param) {
  document.getElementById("add_education_form").reset();
  academic_id = $(param).attr("value");
  degree_level = `<option value="${$(param).parents("tr").find("#degree_level_id").val()}" selected='1'>${$(param).parents("tr").find("#degree_level_id").val()}</option>`;
  degree = `<option value="${$(param).parents("tr").find("#degree_name").val()}" selected='1'>${$(param).parents("tr").find("#degree_name").attr("degree_name")}</option>`;
  year = $(param).parents("tr").find("#year_edu").val();
  total_marks = $(param).parents("tr").find("#tot_marks").val();
  obtained_marks = $(param).parents("tr").find("#obt_marks").val();
  total_cgpa = $(param).parents("tr").find("#tot_cgpa").val();
  obtained_cgpa = $(param).parents("tr").find("#obt_cgpa").val();
  roll_no = $(param).parents("tr").find("#roll_no_tab").val();
  institue_tb = $(param).parents("tr").find("#institute_tab").val();
  board_tb = $(param).parents("tr").find("#board_tab").val();
  specialization = `<option value="${$(param).parents("tr").find("#group_specialization_name").val()}" selected='1'>${$(param).parents("tr").find("#group_specialization_name").attr("group_specialization_name")}</option>`;
  $("#update_education_check").val(1);
  $("#degree_level").val($(param).parents("tr").find("#degree_level_id").val());
  $("#degree_level").trigger("change");
  $("#degree_level").attr("disabled", "1");
  $("#degree_id").append(degree);
  $("#degree_id").attr("disabled", "1");
  $("#year").val(year);
  $("#result_status").val(
    $(param).parents("tr").find("#result_status_update_").val()
  );
  $("#degree_level").trigger("change");
  $("#total_marks").val(total_marks);
  $("#obtained_marks").val(obtained_marks);
  $("#total_cgpa").val(total_cgpa);
  $("#obtained_cgpa").val(obtained_cgpa);
  $("#institute").val(institue_tb);
  $("#percentage").val(
    parseFloat((obtained_marks / total_marks) * 100).toFixed(2)
  );
  $("#roll_no").val(roll_no);
  $("#board").val(board_tb);
  degree_id = $("#degree_id").val();
  degree_name = $("#degree_id option:selected").text().trim();
  if (
    degree_name == "O-Level" ||
    degree_name == "olevel" ||
    degree_name == "o-level"
  ) {
    $("#result_status").parent().hide();
    $("#board").parent().parent().hide();
    $("#roll_no").parent().parent().hide();
    $("#olevel_calculator_btn").show();
    $("#alevel_calculator_btn").hide();
    $("#obtained_marks").attr("readonly", "1");
    $("#total_marks").attr("readonly", "1");
    return false;
  } else if (
    degree_name == "A-Level" ||
    degree_name == "alevel" ||
    degree_name == "a-level"
  ) {
    $("#result_status").parent().hide();
    $("#board").parent().parent().hide();
    $("#roll_no").parent().parent().hide();
    $("#olevel_calculator_btn").hide();
    $("#alevel_calculator_btn").show();
    $("#obtained_marks").attr("readonly", "1");
    $("#total_marks").attr("readonly", "1");
    return false;
  } else {
    $("#result_status").parent().show();
    $("#board,#specialization_id,#roll_no").parent().parent().show();
    $("#olevel_calculator_btn,#alevel_calculator_btn").hide();
    $("#obtained_marks,#total_marks").removeAttr("readonly");
  }
  degree_level_code = $("#degree_level option:selected").attr("code").toLowerCase().trim();
  if (degree_level_code == "ssc" || degree_level_code == "hssc") {
    var formData = new FormData();
    formData.append("degree_id", degree_id);
    $.ajax({
      url: "/degree/specializations/",
      type: "POST",
      dataType: "json",
      data: formData,
      contentType: false,
      processData: false,
      success: function (data) {
        result_status_change();
        if (data.status == "noerror") {
          $("#specialization_id").empty();
          $("#specialization_id").append(
            "<option selected='1' value=''>Select Specializations </option>"
          );
          for (j = 0; j < data.specializations.length; j++) {
            selected_option = $(param).parents("tr").find("#group_specialization_name").val();
            if (data.specializations[j].id == parseInt(selected_option)) {
              $("#specialization_id").append(
                "<option selected='1' value=" +
                data.specializations[j].id +
                ">" +
                data.specializations[j].name +
                "</option>"
              );
            } else {
              $("#specialization_id").append(
                "<option value=" +
                data.specializations[j].id +
                ">" +
                data.specializations[j].name +
                "</option>"
              );
            }
          }
        } else {
          console.error(data);
        }
      },
    });
  } else {
    $("#specialization_id").parent().parent().hide();
  }
  degree_level_selected = $("#degree_level option:selected").attr("code").toLowerCase();
  if (degree_level_selected == "ssc") {
    $("#institute_university").parent().hide();
    $("#institute_college").parent().hide();
    $("#institute_school").parent().show();
    $("#institute_school").val(institue_tb);
    $("#cgpa_marks_radio_row").hide();
    $("#exam_type").show();
    $("#marks_div_row").show();
    $("#total_cgpa").parent().hide();
    $("#obtained_cgpa").parent().hide();
    $("#percentage_cgpa").parent().parent().hide();
    $("#total_marks").siblings("span").html("Total Marks:");
    $("#obtained_marks").siblings("span").html("Obtained Marks:");
  } else if (degree_level_selected == "hssc") {
    $("#institute_university").parent().hide();
    $("#institute_college").parent().show();
    $("#exam_type").show();
    $("#institute_college").val(institue_tb);
    $("#institute_school").parent().hide();
    $("#cgpa_marks_radio_row").hide();
    $("#marks_div_row").show();
    $("#total_cgpa").parent().hide();
    $("#obtained_cgpa").parent().hide();
    $("#percentage_cgpa").parent().parent().hide();
    $("#total_marks").siblings("span").html("Total Marks:");
    $("#obtained_marks").siblings("span").html("Obtained Marks:");
  } else {
    $("#institute_university").parent().show();
    $("#institute_college").parent().hide();
    $("#institute_school").parent().hide();
    $("#institute_school").parent().hide();
    // ✅ FIX: Show Board & Roll No for university level too
    $("#board").parent().show();
    $("#roll_no").parent().show();
    
    if (total_cgpa > 0 || obtained_cgpa > 0) {
      $("#cgpa_marks_radio_row").show();
      $("input[name='marks_cgpa'][value='cgpa']").prop("checked", true);
      $("#total_cgpa,#obtained_cgpa").parent().show();
      $("#marks_div_row").hide();
      $("#percentage_cgpa").parent().parent().hide();
      // ✅ CGPA labels
      $("#total_marks").siblings("span").html("Total CGPA:");
      $("#obtained_marks").siblings("span").html("Obtained CGPA:");
    } else {
      $("#cgpa_marks_radio_row").show();
      $("input[name='marks_cgpa'][value='marks']").prop("checked", true);
      $("#marks_div_row").show();
      $("#total_cgpa").parent().hide();
      $("#obtained_cgpa").parent().hide();
      $("#percentage_cgpa").parent().parent().hide();
      // ✅ Marks labels
      $("#total_marks").siblings("span").html("Total Marks:");
      $("#obtained_marks").siblings("span").html("Obtained Marks:");
    }
  }
  $("#subject_div").empty();
  if (
    $(param).parents("tr").find("#subject_marks_td").find("input").length > 0
  ) {
    $("#subject_div").append("<h3>Subjects Details</h3>");
    $("#subject_div").append("<hr/>");
    selection_div = `<select required='1' id='selected_subject'>${selection_subjects}</select>`;
    var selection_subjects =
      "'<option selected='1' value=''>Select Subject</option>'";
    $(param).parents("tr").find("#subject_marks_td").find("input").each(function (index, element) {
      sub_name = $(element).attr("value");
      tot_marks = $(element).attr("total_marks");
      obt_marks = $(element).attr("obtained_marks");
      selection_subjects += `<option selected='1' value='${$(element).attr(
        "id"
      )}'> ${$(element).attr("value")}</option>`;
      str = `<div class='subject_main_div row' id ='${element.id}'>
<div id='select_marks_div' class="col-md-2 mt-2 px-0">
<select onchange='prepare_subject(this)' required='1' class='form-control' name='selected_subject' id='selected_subject'>${selection_subjects}</select>
</div>
<div class="col-lg-4 mt-1">
<input onchange='check_subject_marks(this)' maxlength='4' class="form-control subj_marks validate_number" onkeypress="return (event.charCode >= 48 && event.charCode <= 57) || (event.charCode == 13)" placeholder='Obtained Marks' required='1' type="text" value='${tot_marks}' name="subj_marks" id="${element.name}_marks" />
</div>
<div class="col-lg-5 mt-1">
<input class="form-control subject_total_marks validate_number" maxlength='4' onchange='check_subject_marks(this)' onkeypress="return (event.charCode >= 48 && event.charCode <= 57) || (event.charCode == 13)" placeholder='Total Marks' required='1' type="text" value='${obt_marks}' name="subj_total_marks" id="${element.name}_total_marks" />
</div>
</div>
`;
      $("#subject_div").append(str);
      selection_subjects =
        "'<option selected='1' value=''>Select Subject</option>'";
    });
  }
}
function add_education_check() {
  // this funciton is used to disabled degree level that is already added
  document.getElementById("update_education_check").value = 0;
  document.getElementById("add_education_form").reset();
  $("#degree_level").removeAttr("disabled");
  $("#degree_id").removeAttr("disabled");
  $("#add_education_form").find(`#degree_level option`).each(function (index, element) {
    $(element).removeAttr("disabled");
  });
  $("#education_table_body").find("tr").each(function (index, element) {
    degree_leveladded = $(element).attr("degree_level");
    $("#add_education_form").find(`#degree_level option:contains(${degree_leveladded})`).attr("disabled", "1");
  });
}
$(document).ready(function () {
  // education details js
  $("#olevel_calculator_btn,#alevel_calculator_btn").hide();
  $("#total_cgpa,#obtained_cgpa,#roll_number_last,#last_year_slip").parent().hide();
  if ($("#education_table").find("tbody tr").length < 1) {
    $("#education_table").hide();
  }
  $("#result_status").on("change", function () {
    result_status_change();
  });
  $("#degree_level").on("change", function (e) {
    val = $(this).val();
    if ($("#degree_level").val() == "") {
      return false;
    }
    document.getElementById("add_education_form").reset();
    $("#degree_level").val(val);
    $("#subject_div").empty();
    $("#olevel_calculator_btn,#alevel_calculator_btn").hide();
    $("#percentage_cgpa").parent().parent().hide();
    $("#specialization_id").empty();
    $("#specialization_id").append(
      "<option selected='1' value=''>Select Specializations </option>"
    );
    if (
      $("#degree_level option:selected").attr("code").toLowerCase().trim() ==
      "ssc" ||
      $("#degree_level option:selected").attr("code").toLowerCase().trim() ==
      "hssc"
    ) {
      $("#specialization_id").parent().parent().show();
    } else {
      $("#specialization_id").parent().parent().hide();
    }
    degree_level_id = $("#degree_level").val();
    var formData = new FormData();
    formData.append("degree_id", degree_level_id);
    $.ajax({
      url: "/degree/level/degree/",
      type: "POST",
      dataType: "json",
      data: formData,
      contentType: false,
      processData: false,
      success: function (data) {
        if (data.status == "noerror") {
          $("#degree_id").empty();
          $("#degree_id").append(
            " <option selected='1' value='0'+ >Select Degree </option>"
          );
          for (j = 0; j < data.degrees.length; j++) {
            $("#degree_id").append(
              " <option code=" +
              data.degrees[j].code +
              " value=" +
              data.degrees[j].id +
              " > " +
              data.degrees[j].name +
              "</option>"
            );
          }
          if (
            $("#degree_level option:selected").attr("code").trim().toLowerCase() == "ssc"
          ) {
            $("#result_status").val("complete");
            $("#result_status").css({ "pointer-events": "none" });
          } else {
            $("#result_status").val("");
            $("#result_status").css({ "pointer-events": "" });
          }
          // ✅ FIXED BLOCK: For 14/16/18 years education
          if (
            $("#degree_level option:selected").attr("code").trim() == "UG-14" ||
            $("#degree_level option:selected").attr("code").trim() == "UG-16" ||
            $("#degree_level option:selected").attr("code").trim() == "GRAD-16" ||
            $("#degree_level option:selected").attr("code").trim() == "GRAD-18"
          ) {
            $("#cgpa_marks_radio_row").show();
            $("#result_status").val("complete");
            $("#result_status").css({ "pointer-events": "none" });
            
            // ✅ FIX: Show Board & Roll No for all degree levels
            $("#board").parent().show();
            $("#roll_no").parent().show();
            
            $("#institute_university").parent().show();
            $("#institute_college").parent().hide();
            $("#institute_school").parent().hide();
            
            // ✅ Default to CGPA mode
            $("input[name='marks_cgpa'][value='cgpa']").prop("checked", true);
            $("#obtained_marks,#percentage,#total_marks").parent().hide();
            $("#total_cgpa,#obtained_cgpa").parent().show();
            $("#percentage_cgpa").parent().parent().hide();
            // ✅ Update labels to CGPA
            $("#total_marks").siblings("span").html("Total CGPA:");
            $("#obtained_marks").siblings("span").html("Obtained CGPA:");
            
          } else {
            if (
              $("#degree_level option:selected").attr("code").trim().toLowerCase() == "ssc"
            ) {
              $("#institute_school").parent().show();
              $("#institute_college").parent().hide();
              $("#institute_university").parent().hide();
              $("#board").parent().show();
              $("#exam_type").show();
            } else if (
              $("#degree_level option:selected").attr("code").trim().toLowerCase() == "hssc"
            ) {
              $("#institute_college").parent().show();
              $("#institute_school").parent().hide();
              $("#institute_university").parent().hide();
              $("#exam_type").show();
              $("#board").parent().show();
            } else {
              $("#institute_college").parent().hide();
              $("#institute_school").parent().hide();
              $("#board").parent().hide();
              $("#institute_university").parent().show();
            }
            $("#result_status").css({ "pointer-events": "" });
            $("#cgpa_marks_radio_row").hide();
            $("#total_cgpa,#obtained_cgpa").parent().hide();
            $("#obtained_marks,#total_marks,#roll_no,#percentage").parent().show();
            // ✅ Reset labels to Marks
            $("#total_marks").siblings("span").html("Total Marks:");
            $("#obtained_marks").siblings("span").html("Obtained Marks:");
          }
        }
      },
    });
  });
  // --------------ending degree level ------------//
  
  // ✅ FIXED: CGPA/Marks radio button change handler with label updates
  $("input[name='marks_cgpa']").on("change", function () {
    if ($(this).val() != "marks") {
      // CGPA selected
      $("#obtained_marks,#percentage,#total_marks").parent().hide();
      $("#total_cgpa,#obtained_cgpa").parent().show();
      $("#percentage_cgpa").parent().parent().hide();
      // ✅ Update labels to CGPA
      $("#total_marks").siblings("span").html("Total CGPA:");
      $("#obtained_marks").siblings("span").html("Obtained CGPA:");
    } else {
      // Marks selected
      $("#obtained_marks,#total_marks,#percentage").parent().show();
      $("#percentage_cgpa").parent().parent().hide();
      $("#total_cgpa,#obtained_cgpa").parent().hide();
      // ✅ Update labels to Marks
      $("#total_marks").siblings("span").html("Total Marks:");
      $("#obtained_marks").siblings("span").html("Obtained Marks:");
    }
  });
  
  $("#degree_id").on("change", function (e) {
    $("#obtained_marks,#total_marks,#percentage").val("");
    degree_id = $("#degree_id").val();
    degree_name = $("#degree_id option:selected").text().trim();
    if (
      degree_name == "O-Level" ||
      degree_name == "olevel" ||
      degree_name == "o-level" ||
      degree_name == "OLEVEL"
    ) {
      $("#result_status").parent().hide();
      $("#board").parent().parent().hide();
      $("#roll_no").parent().parent().hide();
      $("#olevel_calculator_btn").show();
      $("#alevel_calculator_btn").hide();
      $("#obtained_marks").attr("readonly", "1");
      $("#total_marks").attr("readonly", "1");
    } else if (
      degree_name == "A-Level" ||
      degree_name == "alevel" ||
      degree_name == "a-level" ||
      degree_name == "ALEVEL"
    ) {
      $("#result_status").parent().hide();
      $("#board").parent().parent().hide();
      $("#roll_no").parent().parent().hide();
      $("#olevel_calculator_btn").hide();
      $("#alevel_calculator_btn").show();
      $("#obtained_marks").attr("readonly", "1");
      $("#total_marks").attr("readonly", "1");
    } else {
      $("#result_status").parent().show();
      $("#board").parent().parent().show();
      $("#roll_no").parent().parent().show();
      $("#olevel_calculator_btn").hide();
      $("#alevel_calculator_btn").hide();
      $("#obtained_marks").removeAttr("readonly");
      $("#total_marks").removeAttr("readonly");
    }
    if (
      $("#degree_level option:selected").attr("code").toLowerCase().trim() == "hssc"
    ) {
      var formData = new FormData();
      formData.append("degree_id", degree_id);
      $.ajax({
        url: "/degree/specializations/",
        type: "POST",
        dataType: "json",
        data: formData,
        contentType: false,
        processData: false,
        success: function (data) {
          if (data.status == "noerror") {
            $("#specialization_id").empty();
            $("#specialization_id").append(
              "<option selected='1' value=''>Select Specializations </option>"
            );
            for (j = 0; j < data.specializations.length; j++) {
              $("#specialization_id").append(
                "<option value=" +
                data.specializations[j].id +
                ">" +
                data.specializations[j].name +
                "</option>"
              );
            }
          }
        },
      });
    }
  });
});
