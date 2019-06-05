@echo off

set dispatcher = %1
set git_path = %2

if not defined dispatcher (
	set dispatcher = "-git_add_changed"
	goto :DISPATCH_no_definition
)

if not defined git_path (
	set git_path = %~dp0
	goto :DISPATCH_no_path
)

if exist .git (
	if /I "%dispatcher%" == "-git_add_changed" (
		goto :DISPATCH_git_add_changed
	) else (
		if /I "%dispatcher%" == "-git_commit_message" (
			goto :DISPATCH_git_commit_message
		) else (
			if /I "%dispatcher%" == "-git_push_master" (
				goto :DISPATCH_git_push_master
			)
		)
	)
) else (
	cscript %~dp0/includes/ShowPopup.vbs "Error, You did not run this macro in a valid GIT directory!"
)


:DISPATCH_no_definition
cscript %~dp0/includes/ShowPopup.vbs "Error, no git command was defined: %dispatcher%"

:DISPATCH_no_path
cscript %~dp0/includes/ShowPopup.vbs "Error, not git repo was defined: %git_path%"