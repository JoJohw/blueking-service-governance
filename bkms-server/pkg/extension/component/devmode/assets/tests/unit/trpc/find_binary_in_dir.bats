#!/usr/bin/env bats

load '../../helpers/find_bin.bash'

# 合法 app name 示例：
# - 只包含小写字母 / 数字 / 中划线
# - 以小写字母开头

@test "trpc find_binary_in_dir returns the binary when its name exactly matches app name" {
    local case_name="exact_match"
    local fixture_spec="create_binary:demo-app-1"
    local app_name="demo-app-1"
    local search_dir_mode="existing"
    local ls_stub_mode="real"
    local expected_status="0"
    local expected_output="demo-app-1"

    assert_find_binary_in_dir_case \
        "trpc/utils.sh" \
        "${case_name}" \
        "${fixture_spec}" \
        "${app_name}" \
        "${search_dir_mode}" \
        "${ls_stub_mode}" \
        "${expected_status}" \
        "${expected_output}"
}

@test "trpc find_binary_in_dir matches the binary when only letter case differs" {
    local case_name="case_insensitive_match"
    local fixture_spec="create_binary:Demo-App-1"
    local app_name="demo-app-1"
    local search_dir_mode="existing"
    local ls_stub_mode="real"
    local expected_status="0"
    local expected_output="Demo-App-1"

    assert_find_binary_in_dir_case \
        "trpc/utils.sh" \
        "${case_name}" \
        "${fixture_spec}" \
        "${app_name}" \
        "${search_dir_mode}" \
        "${ls_stub_mode}" \
        "${expected_status}" \
        "${expected_output}"
}

@test "trpc find_binary_in_dir matches the binary when app name uses hyphens but binary in different form" {
    local case_name="hyphenated_app_name_matches_camel_case_binary"
    local fixture_spec="create_binary:Somecoolgame-Server"
    local app_name="some-cool-game-server"
    local search_dir_mode="existing"
    local ls_stub_mode="real"
    local expected_status="0"
    local expected_output="Somecoolgame-Server"

    assert_find_binary_in_dir_case \
        "trpc/utils.sh" \
        "${case_name}" \
        "${fixture_spec}" \
        "${app_name}" \
        "${search_dir_mode}" \
        "${ls_stub_mode}" \
        "${expected_status}" \
        "${expected_output}"
}

@test "trpc find_binary_in_dir matches the binary when it uses mixed case without separators" {
    local case_name="hyphenated_app_name_matches_mixed_case_compact_binary"
    local fixture_spec="create_binary:sOmEcOoLgAmEsErVeR2"
    local app_name="some-cool-game-server-2"
    local search_dir_mode="existing"
    local ls_stub_mode="real"
    local expected_status="0"
    local expected_output="sOmEcOoLgAmEsErVeR2"

    assert_find_binary_in_dir_case \
        "trpc/utils.sh" \
        "${case_name}" \
        "${fixture_spec}" \
        "${app_name}" \
        "${search_dir_mode}" \
        "${ls_stub_mode}" \
        "${expected_status}" \
        "${expected_output}"
}

@test "trpc find_binary_in_dir matches the binary when hyphens and underscores differ" {
    local case_name="hyphenated_app_name_matches_underscore_binary"
    local fixture_spec="create_binary:demo_app"
    local app_name="demo-app"
    local search_dir_mode="existing"
    local ls_stub_mode="real"
    local expected_status="0"
    local expected_output="demo_app"

    assert_find_binary_in_dir_case \
        "trpc/utils.sh" \
        "${case_name}" \
        "${fixture_spec}" \
        "${app_name}" \
        "${search_dir_mode}" \
        "${ls_stub_mode}" \
        "${expected_status}" \
        "${expected_output}"
}

@test "trpc find_binary_in_dir strips the executable marker emitted by ls output" {
    local case_name="match_with_executable_marker"
    local fixture_spec="create_binary:demo-app-1"
    local app_name="demo-app-1"
    local search_dir_mode="existing"
    local ls_stub_mode="append_star"
    local expected_status="0"
    local expected_output="demo-app-1"

    assert_find_binary_in_dir_case \
        "trpc/utils.sh" \
        "${case_name}" \
        "${fixture_spec}" \
        "${app_name}" \
        "${search_dir_mode}" \
        "${ls_stub_mode}" \
        "${expected_status}" \
        "${expected_output}"
}

@test "trpc find_binary_in_dir returns empty output when the directory has no matching binary" {
    local case_name="unrelated_binary"
    local fixture_spec="create_binary:other-app-2"
    local app_name="demo-app-1"
    local search_dir_mode="existing"
    local ls_stub_mode="real"
    local expected_status="1"
    local expected_output="${TEST_EMPTY_OUTPUT}"

    assert_find_binary_in_dir_case \
        "trpc/utils.sh" \
        "${case_name}" \
        "${fixture_spec}" \
        "${app_name}" \
        "${search_dir_mode}" \
        "${ls_stub_mode}" \
        "${expected_status}" \
        "${expected_output}"
}

@test "trpc find_binary_in_dir returns empty output when only a dotted name exists" {
    local case_name="dotted_name_does_not_match"
    local fixture_spec="create_binary:demo.app"
    local app_name="demo-app"
    local search_dir_mode="existing"
    local ls_stub_mode="real"
    local expected_status="1"
    local expected_output="${TEST_EMPTY_OUTPUT}"

    assert_find_binary_in_dir_case \
        "trpc/utils.sh" \
        "${case_name}" \
        "${fixture_spec}" \
        "${app_name}" \
        "${search_dir_mode}" \
        "${ls_stub_mode}" \
        "${expected_status}" \
        "${expected_output}"
}

@test "trpc find_binary_in_dir returns empty output when only a longer prefixed name exists" {
    local case_name="prefix_only_match"
    local fixture_spec="create_binary:demo-app-1-sidecar"
    local app_name="demo-app-1"
    local search_dir_mode="existing"
    local ls_stub_mode="real"
    local expected_status="1"
    local expected_output="${TEST_EMPTY_OUTPUT}"

    assert_find_binary_in_dir_case \
        "trpc/utils.sh" \
        "${case_name}" \
        "${fixture_spec}" \
        "${app_name}" \
        "${search_dir_mode}" \
        "${ls_stub_mode}" \
        "${expected_status}" \
        "${expected_output}"
}

@test "trpc find_binary_in_dir returns empty output when the search directory does not exist" {
    local case_name="missing_search_dir"
    local fixture_spec="empty_dir"
    local app_name="demo-app-1"
    local search_dir_mode="missing"
    local ls_stub_mode="real"
    local expected_status="0"
    local expected_output="${TEST_EMPTY_OUTPUT}"

    assert_find_binary_in_dir_case \
        "trpc/utils.sh" \
        "${case_name}" \
        "${fixture_spec}" \
        "${app_name}" \
        "${search_dir_mode}" \
        "${ls_stub_mode}" \
        "${expected_status}" \
        "${expected_output}"
}
